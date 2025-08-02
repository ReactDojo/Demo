import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Contract } from '../../app/models/contract.model';
import { Account } from '../../app/models/account.model';
import { Frequency } from '../../app/models/frequency.model';
import { Vendor } from '../../app/models/vendor.model';
import { ContractService } from '../../app/services/contract.service';
import { AccountService } from '../../app/services/account.service';
import { FrequencyService } from '../../app/services/frequency.service';
import { VendorService } from '../../app/services/vendor.service';
import { CustomerService } from '../services/customer.service';
import { ProductService } from '../../app/services/product.service';
import { Customer } from '../customer/customer.model';
import { NgSelectModule } from '@ng-select/ng-select';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-contract',
  standalone: true,
  imports: [CommonModule, 
    ReactiveFormsModule, 
    FormsModule, NgSelectModule,ToastrModule,],
  templateUrl: './contract.component.html'
})
export class ContractComponent implements OnInit {
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
    
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCustomers();
    this.loadVendors();
    this.loadFrequencies();
    this.loadProducts();
    

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
  
      const adjustedPayments = Math.max(duration - initialPayments, 0);
      const calculatedMonthly = adjustedPayments > 0 ? financedAmount / adjustedPayments : 0;
      const calculatedRunningTotal = (calculatedMonthly * adjustedPayments) - (initialPayments * calculatedMonthly);
  
      // Update the form fields (but suppress further event emission to avoid infinite loop)
      this.contractForm.patchValue({
        downpayment: originalAmount - financedAmount,
        monthlyAmount: calculatedMonthly
      }, { emitEvent: false });
  
      // Update view-bound variables
      this.runningTotal = calculatedRunningTotal;
      this.adjustedPayments = adjustedPayments;
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
      customermonthlyamount: ['', Validators.required],
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

  submitForm() {
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
  
    const form = this.contractForm.value;
    const selectedProduct = this.products.find(p => p.productID === form.productID);
    const originalPaymentCount = selectedProduct?.durationMonths || 0;
    const initialPaymentsMade = form.initialPaymentsMade || 0;
    const adjustedPayments = originalPaymentCount - initialPaymentsMade;
  
    const downpayment = form.originalAmount - form.financedAmount;
  
    // Calculate customer monthly amount (monthlyBilling)
    const monthlyBilling = adjustedPayments > 0
      ? form.financedAmount / adjustedPayments
      : 0;
  
    const runningTotal = monthlyBilling * adjustedPayments;
    const adjustedFinancedAmount = runningTotal;
  
    // Contract payload
    const contractPayload: Contract = {
      supplierID: form.vendorID,
      customerID: form.customerID,
      productID: form.productID,
      frequencyID: form.frequencyID,
      startDate: form.startDate,
      endDate: form.endDate,
      originalAmount: form.originalAmount,
      downpayment: form.originalAmount - form.financedAmount,
      customermonthlyamount: this.contractForm.value.customermonthlyamount,
      paymentOnProduct: this.adjustedPayments, // ✅ <-- from live calc
      financedAmount: form.financedAmount,
      runningTotal: this.runningTotal,         // ✅ <-- from live calc
      daysOfWeek: form.daysOfWeek,
      contractData: form,
      notes: form.notes,
      monthlyPayment: form.financedAmount /selectedProduct.durationMonths //this.contractForm.value.monthlyAmount
    };
    
  
    console.log("📦 Contract payload:", contractPayload);
  
    this.contractService.createContract(contractPayload).subscribe({
      next: contract => {
        console.log("✅ Contract saved:", contract);
  
        const accountPayload: Account = {
          customerID: contract.customerID,
          supplierID: contract.supplierID,
          contractID: contract.contractID!,
          frequencyID: contract.frequencyID!,
          startDate: contract.startDate!,
          endDate: contract.endDate!,
          monthlyBilling: form.financedAmount /selectedProduct.durationMonths,
          monthlyPayment: this.contractForm.value.customermonthlyamount,
          originalAmount: contract.originalAmount,
          royaltyFee: 0,
          balance: 0,
          productID: contract.productID!,
          financedAmount: contract.financedAmount ?? 0,
          daysOfWeek: contract.daysOfWeek ?? '',
          runningTotal: this.runningTotal
        };
  
        console.log("📦 Account payload:", accountPayload);
  
        this.accountService.createAccount(accountPayload).subscribe({
          next: () => {
            console.log("✅ Account saved successfully.");
            this.toastr.success('Contract and account saved successfully.', 'Success');
            this.submitting = false;
            this.contractForm.reset();
          },
          error: (err) => {
            console.error("❌ Error saving account:", err);
            this.toastr.error('Account creation failed.', 'Error');
            this.submitting = false;
          }
        });
      },
      error: (err) => {
        console.error("❌ Error saving contract:", err);
        this.toastr.error('Contract creation failed.', 'Error');
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
