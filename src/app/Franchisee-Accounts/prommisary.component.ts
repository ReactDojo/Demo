import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { ContractService } from 'src/app/services/contract.service';
import { VendorService } from 'src/app/services/vendor.service';
import { CustomerService } from 'src/app/services/customer.service';
import { ProductService } from 'src/app/services/product.service';
import { FrequencyService } from 'src/app/services/frequency.service';
import { Contract } from 'src/app/models/contract.model';
import { Vendor } from 'src/app/models/vendor.model';
import { Customer } from 'src/app/customer/customer.model';
import { Product } from '../models/product.model';
import { Frequency } from '../models/frequency.model';
import { forkJoin } from 'rxjs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-promissary-contracts',
  standalone: true,
  templateUrl: './promissary.component.html',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgSelectModule, ToastrModule],
})
export class PromissaryContractsComponent implements OnInit {
  filterForm: FormGroup;
  billPrivateNote: string;
  contracts: Contract[] = [];
  filteredContracts: Contract[] = [];
  vendors: Vendor[] = [];
  customers: Customer[] = [];
  products: Product[] = [];
  frequencies: Frequency[] = [];
  selectedVendorId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private contractService: ContractService,
    private vendorService: VendorService,
    private customerService: CustomerService,
    private productService: ProductService,
    private frequencyService: FrequencyService,
    private toastr: ToastrService
  ) {
    this.filterForm = this.fb.group({ vendorID: [null] });
    const now = new Date();
    const month = now.toLocaleString('default', { month: 'long' });
    const year = now.getFullYear();
    this.billPrivateNote = `Franchisee billing for ${month} ${year}`;
  }

  ngOnInit(): void {
    this.loadVendors();
    this.loadCustomers();
    this.loadProducts();
    this.loadFrequencies();
  }

  loadVendors(): void {
    this.vendorService.getVendors().subscribe(v => this.vendors = v);
  }

  loadCustomers(): void {
    this.customerService.getCustomers().subscribe(c => this.customers = c);
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe(p => this.products = p);
  }

  loadFrequencies(): void {
    this.frequencyService.getFrequencies().subscribe(f => this.frequencies = f);
  }

  onVendorChange(): void {
    const vendorId = this.filterForm.get('vendorID')?.value;
    if (!vendorId) return;
    this.selectedVendorId = vendorId;
    this.contractService.getContractsByVendor(vendorId).subscribe(contracts => {
      this.filteredContracts = contracts.filter(c => c.paymentOnProduct !== 0);
    });
  }

  getCustomerName(customerID: number | string): string {
    const match = this.customers.find(c => String(c.Id) === String(customerID));
    return match ? match.DisplayName : 'Unknown';
  }

  getProductName(productID: number | string): string {
    const match = this.products.find(p => String(p.productID) === String(productID));
    return match ? `${match.durationMonths} months` : 'Unknown';
  }

  getFrequencyName(frequencyID: number | string): string {
    const match = this.frequencies.find(f => String(f.frequencyID) === String(frequencyID));
    return match ? match.description : 'Unknown';
  }

  deleteContract(contractID: number): void {
    if (confirm('Are you sure you want to delete this contract?')) {
      this.contractService.deleteContract(contractID).subscribe(() => {
        this.filteredContracts = this.filteredContracts.filter(c => c.contractID !== contractID);
        this.toastr.success('Contract deleted.');
      });
    }
  }

  printForm(): void {
    const content = document.getElementById('pdf-summary');
    if (!content) return;

    window.scrollTo(0, 0);
    html2canvas(content, { scale: 2, useCORS: true }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('Franchisee-Summary.pdf');
    });
  }
}
