import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Contract } from '../models/contract.model';
import { Account } from '../models/account.model';
import { Frequency } from '../models/frequency.model';
import { Vendor } from '../models/vendor.model';
import { ContractService } from '../services/contract.service';
import { AccountService } from '../services/account.service';
import { FrequencyService } from '../services/frequency.service';
import { VendorService } from '../services/vendor.service';
import { CustomerService } from '../services/customer.service';
import { ProductService } from '../services/product.service';
import { Customer } from '../customer/customer.model';
import { NgSelectModule } from '@ng-select/ng-select';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, forkJoin } from 'rxjs';

@Component({
  selector: 'app-contract',
  standalone: true,
  imports: [CommonModule, 
    ReactiveFormsModule, 
    FormsModule, NgSelectModule,ToastrModule,],
  templateUrl: './contract-edit.component.html'
})
export class ContractEditComponent implements OnInit {
  contractId: number | null = null;
  daysOfWeek: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  selectedDays: string[] = [];
  daySelectionError: string = '';
  contractForm!: FormGroup;
  customers: Customer[] = [];
  frequencies: Frequency[] = [];
  vendors: Vendor[] = [];
  products: any[] = [];
  contracts: Contract[] = [];
  submitting = false;

  // 🔽 Declare these here:
  runningTotal: number = 0;
  adjustedPayments: number = 0;

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private contractService: ContractService,
    private accountService: AccountService,
    private frequencyService: FrequencyService,
    private vendorService: VendorService,
    private productService: ProductService,
    private toastr: ToastrService,
    private route: ActivatedRoute,
    private router: Router,
    
  ) {}

  ngOnInit(): void {
    this.initForm();

    const dataSources = {
      customers: this.customerService.getCustomers(),
      vendors: this.vendorService.getVendors(),
      frequencies: this.frequencyService.getFrequencies(),
      products: this.productService.getProducts()
    };

    forkJoin(dataSources).subscribe({
      next: (data: any) => {
        this.customers = data.customers;
        this.vendors = data.vendors;
        this.frequencies = Array.isArray(data.frequencies) ? data.frequencies : [];
        this.products = Array.isArray(data.products) ? data.products : [];

        this.route.paramMap.subscribe(params => {
          const vendorId = params.get('vendorId');
          const contractId = params.get('contractId');

          if (vendorId && contractId) {
            this.contractId = +contractId;
            this.loadContractFromVendorList(+vendorId, +contractId);
          } else {
            this.toastr.info('Creating a new contract.', 'Info');
          }
        });
      },
      error: (err) => {
        this.toastr.error('Failed to load essential data. Please try again later.', 'Error');
        console.error(err);
      }
    });

    // Load contracts when vendorID changes
    this.contractForm.get('vendorID')?.valueChanges.subscribe((supplierID: number) => {
      if (supplierID) {
        this.contractService.getContractsBySupplier(supplierID).subscribe(data => {
          this.contracts = data.filter(c => c.accountID !== 100);
        });
      } else {
        this.contracts = [];
      }
    });

    this.contractForm.valueChanges.subscribe(values => {
      const originalAmount = values.originalAmount ?? 0;
      const financedAmount = values.financedAmount ?? 0;
      const product = this.products.find(p => p.productID === values.productID);
      const initialPayments = values.initialPaymentsMade ?? 0;
      const duration = product?.durationMonths ?? 0;
      console.log("🔄 duration", duration);

      const adjustedPayments = Math.max(duration - initialPayments, 0);
      const calculatedMonthly = adjustedPayments > 0 ? financedAmount / duration : 0;
      const calculatedRunningTotal = (calculatedMonthly * adjustedPayments);

      this.contractForm.patchValue({
        downpayment: originalAmount - financedAmount,
        monthlyAmount: calculatedMonthly
      }, { emitEvent: false });

      this.runningTotal = calculatedRunningTotal;
      this.adjustedPayments = adjustedPayments;
    });
  }

  loadContractFromVendorList(vendorId: number, contractId: number): void {
    this.contractService.getContractsBySupplier(vendorId).subscribe({
      next: (contracts) => {
        const contract = contracts.find(c => c.contractID === contractId);
        if (contract) {
          let formData: any = {};
          if (contract.contractData) {
            try {
              formData = JSON.parse(contract.contractData);
            } catch (e) {
              console.error('Error parsing contractData:', e);
              formData = {};
            }
          }

          const vendor = this.vendors.find(v => v.vendorID === contract.supplierID);
          const customer = this.customers.find(c => c.Id === contract.customerID.toString());

          this.contractForm.patchValue({
            vendorID: vendor ? vendor.Id : null,
            customerID: customer ? customer.Id : null,
            productID: contract.productID,
            frequencyID: contract.frequencyID,
            startDate: contract.startDate ? new Date(contract.startDate).toISOString().split('T')[0] : '',
            endDate: contract.endDate ? new Date(contract.endDate).toISOString().split('T')[0] : '',
            originalAmount: contract.originalAmount,
            financedAmount: contract.financedAmount,
            notes: contract.notes,
            customerMonthlyAmount: formData.customerMonthlyAmount || contract.customerMonthlyAmount || null,
            initialPaymentsMade: formData.initialPaymentsMade || null,
            downpayment: formData.downpayment || null,
            monthlyAmount: formData.monthlyAmount || null,
            daysOfWeek: formData.daysOfWeek || ''
          });
          
          this.contractForm.get('vendorID')?.disable();

          this.selectedDays = (formData.daysOfWeek || contract.daysOfWeek || '').split(',').filter(d => d);
          this.validateDaysSelection();
          
          this.toastr.success('Contract loaded successfully.', 'Success');
        } else {
          this.toastr.error(`Contract with ID ${contractId} not found for this vendor.`, 'Error');
        }
      },
      error: (err) => {
        console.error(`Error loading contracts for vendor with ID ${vendorId}:`, err);
        this.toastr.error(`Failed to load contracts for vendor with ID ${vendorId}.`, 'Error');
      }
    });
  }

  initForm() {
    this.contractForm = this.fb.group({
      vendorID: [null, Validators.required],
      customerID: [null, Validators.required],
      productID: [null, Validators.required],
      frequencyID: [null, Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      originalAmount: ['', Validators.required],
      financedAmount: ['', Validators.required],
      customerMonthlyAmount: ['', Validators.required],
      downpayment: ['', Validators.required],
      monthlyAmount: ['', Validators.required],
      initialPaymentsMade: [null], 
      notes: [''],
      daysOfWeek: [''] 
    });
      // Optionally you can subscribe to frequency changes to validate dynamically
  this.contractForm.get('frequencyID')?.valueChanges.subscribe(() => {
    this.validateDaysSelection();
  });
  }
  onDaySelectionChange(event: any) {
    const day = event.target.value;
    const checked = event.target.checked;
  
    if (checked) {
      this.selectedDays.push(day);
    } else {
      this.selectedDays = this.selectedDays.filter(d => d !== day);
    }
  
    this.validateDaysSelection();
    this.updateDaysOfWeekInForm();
  }
  billingFrequencyChange() {
    this.validateDaysSelection(); // frequency already updated inside contractForm
  }
  validateDaysSelection() {
    const selectedFrequencyID = this.contractForm.get('frequencyID')?.value;
    const selectedDaysCount = this.selectedDays.length;
  
    // Find the matching frequency object
    const selectedFrequency = this.frequencies.find(f => f.frequencyID === selectedFrequencyID);
  
    if (!selectedFrequency) {
      this.daySelectionError = '';
      return;
    }
  
    // Example: selectedFrequency.description might be "1x per week" or "6x per week"
    const matches = selectedFrequency.description.match(/^(\d+)/);
    const expectedDays = matches ? parseInt(matches[1], 10) : null;
  
    if (!expectedDays) {
      this.daySelectionError = '';
      return;
    }
  
    if (selectedDaysCount > expectedDays) {
      this.daySelectionError = `You can only select ${expectedDays} day(s) for ${selectedFrequency.description}.`;
    } else if (selectedDaysCount < expectedDays) {
      this.daySelectionError = `You must select exactly ${expectedDays} day(s) for ${selectedFrequency.description}.`;
    } else {
      this.daySelectionError = '';
    }
  }
  
  updateDaysOfWeekInForm() {
    const daysString = this.selectedDays.join(',');
    this.contractForm.patchValue({ daysOfWeek: daysString });
  }
  loadCustomers() {
    this.customerService.getCustomers().subscribe(data => {
      console.log('Extracted customers array:', data.length);
      this.customers = data;
    });
  }

  loadVendors() {
    this.vendorService.getVendors().subscribe(data => {
      console.log('Extracted vendors array:', data);
      this.vendors = data;
    });
  }

  loadFrequencies() {
    this.frequencyService.getFrequencies().subscribe(data => {
      console.log('Frequencies:', data);
      this.frequencies = Array.isArray(data) ? data : [];
    });
  }

  loadProducts() {
    this.productService.getProducts().subscribe(data => {
      console.log('Products:', data);
      this.products = Array.isArray(data) ? data : [];
    });
  }

  onVendorChange(event: any) {
    const supplierID = parseInt(event.target.value, 10);
    if (!isNaN(supplierID)) {
      this.contractService.getContractsBySupplier(supplierID).subscribe(data => {
        this.contracts = data;
        console.log("contracts");
        console.log(data);
      });
    }
  }

  deleteContract(contractID: number) {
    if (!confirm("Are you sure you want to mark this contract as inactive?")) return;

    const contract = this.contracts.find(c => c.contractID === contractID);
    if (!contract) {
      this.toastr.error('Contract not found.', 'Error');
      return;
    }

    const updatedContract: Contract = { ...contract, accountID: 100 };

    this.contractService.updateContract(contractID, updatedContract).subscribe({
      next: () => {
        this.contracts = this.contracts.filter(c => c.contractID !== contractID);
        this.toastr.success('Contract marked as inactive.', 'Success');
      },
      error: (err) => {
        console.error("Failed to update contract:", err);
        this.toastr.error('Failed to mark contract as inactive.', 'Error');
      }
    });
  }
  getProductPrice(id: number): number {
    const product = this.products.find(p => p.productID === id);
    return product?.price || 1;
  }
  
  getCustomerName(customerID: number | string): string {
    const match = this.customers.find(c => String(c.Id) === String(customerID));
    if (!match) {
      console.warn(`🔍 Customer ID not found:`, customerID, this.customers);
    }
    return match ? match.DisplayName : 'Unknown';
  }

  getProductName(id: number): string {
    const product = this.products.find(p => p.productID == id);
    return product ? `${product.durationMonths} months` : 'Unknown';
  }

  getFrequencyName(id: number): string {
    return this.frequencies.find(f => f.frequencyID == id)?.description ?? 'Unknown';
  }

  saveContract() {
    console.log("✅ Form submitted.");
    this.validateDaysSelection();
  
    if (this.contractForm.invalid || this.daySelectionError) {
      console.log("🚫 Invalid Form Values:", this.contractForm.value);
      Object.entries(this.contractForm.controls).forEach(([key, control]) => {
        console.log(`${key}:`, {
          value: control.value,
          valid: control.valid,
          errors: control.errors
        });
      });
  
      Object.values(this.contractForm.controls).forEach(control => control.markAsTouched());
      return;
    }
  
    this.submitting = true;
  
    const form = this.contractForm.getRawValue(); // Use getRawValue() to get disabled vendorID
    
    // Find the full vendor and customer objects
    const selectedVendor = this.vendors.find(v => v.Id === form.vendorID);
    const selectedCustomer = this.customers.find(c => c.Id === form.customerID);

    if (!selectedVendor || !selectedCustomer) {
        this.toastr.error('Could not find selected vendor or customer.', 'Error');
        this.submitting = false;
        return;
    }

    const selectedProduct = this.products.find(p => p.productID === form.productID);
    const originalPaymentCount = selectedProduct?.durationMonths || 0;
    const initialPaymentsMade = form.initialPaymentsMade || 0;
    const adjustedPayments = originalPaymentCount - initialPaymentsMade;
    const monthlyBilling = adjustedPayments > 0 ? form.financedAmount / adjustedPayments : 0;
    const runningTotal = monthlyBilling * adjustedPayments;

    // Contract payload with correct numeric IDs
    const contractPayload: Contract = {
      contractID: this.contractId || undefined,
      supplierID: selectedVendor.vendorID, // Use the numeric ID
      customerID: Number(selectedCustomer.Id), // Use the numeric ID
      productID: form.productID,
      frequencyID: form.frequencyID,
      startDate: form.startDate,
      endDate: form.endDate,
      originalAmount: form.originalAmount,
      downpayment: form.originalAmount - form.financedAmount,
      customerMonthlyAmount: this.contractForm.value.customerMonthlyAmount,
      paymentOnProduct: this.adjustedPayments,
      financedAmount: form.financedAmount,
      runningTotal: this.runningTotal,
      daysOfWeek: form.daysOfWeek,
      contractData: JSON.stringify(form), // Save form as a JSON string
      notes: form.notes,
      monthlyPayment: form.financedAmount / (selectedProduct?.durationMonths || 1)
    };
  
    console.log("📦 Contract payload:", contractPayload);
  
    let contractObservable: Observable<any>;

    if (this.contractId) {
      contractObservable = this.contractService.updateContract(this.contractId, contractPayload);
    } else {
      contractObservable = this.contractService.createContract(contractPayload);
    }

    contractObservable.subscribe({
      next: (contract) => {
        console.log("✅ Contract saved:", contract);
        this.toastr.success('Contract saved successfully.', 'Success');
        this.submitting = false;
        this.router.navigate(['/form/Franchisee-Agreement']); // Navigate back to the list/form
      },
      error: (err) => {
        console.error("❌ Error saving contract:", err);
        this.toastr.error('Contract saving failed.', 'Error');
        this.submitting = false;
      }
    });
  }
  
  getTotalOriginalAmount(): number {
    return this.contracts.reduce((total, c) => total + (c.originalAmount || 0), 0);
  }
  
  getTotalFinancedAmount(): number {
    return this.contracts.reduce((total, c) => total + (c.financedAmount || 0), 0);
  }
  
  getTotalRunningTotal(): number {
    return this.contracts.reduce((total, c) => total + (c.runningTotal || 0), 0);
  }
  
  
}
