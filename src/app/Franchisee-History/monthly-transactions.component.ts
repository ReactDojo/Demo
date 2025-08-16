import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TransactionService } from '../services/transaction.service';
import { VendorService } from '../services/vendor.service';
import { CustomerService } from '../services/customer.service';
import { MonthlyAccountTransaction } from '../models/monthly-account-transaction.model';
import { Vendor } from '../models/vendor.model';
import { Customer } from '../customer/customer.model';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { ContractService } from '../services/contract.service';
import { Contract } from '../models/contract.model';
import { ProductService } from '../services/product.service';
import { FrequencyService } from '../services/frequency.service';
import { Product } from '../models/product.model';
import { forkJoin } from 'rxjs';
import { Frequency } from '../models/frequency.model';

@Component({
  selector: 'app-monthly-transactions',
  templateUrl: './monthly-transactions.component.html',
  styleUrls: ['./monthly-transactions.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgSelectModule // ✅ Required for <ng-select> and its bindings like [clearable]
  ]
})
export class MonthlyTransactionsComponent implements OnInit {
  customerNameMap: Map<number, string> = new Map();
  filterForm!: FormGroup;
  vendors: Vendor[] = [];
  customers: Customer[] = [];
  transactions: MonthlyAccountTransaction[] = [];
  contracts: Contract[] = [];
  activeContracts: Contract[] = [];
  inactiveContracts: Contract[] = [];
  products: Product[] = [];
  frequencies: Frequency[] = [];
  years: number[] = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);
  groupedTransactions: { [key: string]: MonthlyAccountTransaction[] } = {};
  groupedKeys: string[] = [];

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private vendorService: VendorService,
    private customerService: CustomerService,
    private contractService: ContractService,
    private productService: ProductService,
    private frequencyService: FrequencyService
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      vendorID: [null],
      year: [new Date().getFullYear()]
    });

    this.vendorService.getVendors().subscribe(v => (this.vendors = v));
    this.customerService.getCustomers().subscribe(customers => {
      this.customers = customers;
      this.customers.forEach(c => this.customerNameMap.set(Number(c.Id), c.DisplayName));
    });
    this.productService.getProducts().subscribe(p => (this.products = p));
    this.frequencyService.getFrequencies().subscribe(f => (this.frequencies = f));
  }

  onVendorChange(): void {
    const vendorId = this.filterForm.get('vendorID')?.value;
    const year = this.filterForm.get('year')?.value;
    if (!vendorId || !year) return;

    forkJoin({
      transactions: this.transactionService.getTransactionsByVendor(vendorId),
      contracts: this.contractService.getContractsBySupplier(vendorId)
    }).subscribe(({ transactions, contracts }) => {
      this.contracts = contracts;
      this.activeContracts = contracts.filter(c => c.accountID !== 100);
      this.inactiveContracts = contracts.filter(c => c.accountID === 100);

      this.transactions = transactions.filter(t => new Date(t.startDate).getFullYear() === year)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

      this.groupTransactions();
    });
  }


  groupTransactions(): void {
    this.groupedTransactions = {};
    for (const tx of this.transactions) {
      const date = new Date(tx.startDate);
      const key = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;

      if (!this.groupedTransactions[key]) {
        this.groupedTransactions[key] = [];
      }
      this.groupedTransactions[key].push(tx);
    }

    this.groupedKeys = Object.keys(this.groupedTransactions).sort(
      (a, b) =>
        new Date(this.groupedTransactions[a][0].startDate).getTime() -
        new Date(this.groupedTransactions[b][0].startDate).getTime()
    );
  }

  getCustomerName(customerId: number): string {
  return this.customerNameMap.get(customerId) || 'Loading...';
  }

  getCustomerMonthlyAmount(contractID: number): number {
    const contract = this.contracts.find(c => c.contractID === contractID);
    return contract?.customermonthlyamount || 0;
  }

  getProductName(id: number): string {
    const product = this.products.find(p => p.productID == id);
    return product ? `${product.durationMonths} months` : 'Unknown';
  }

  getFrequencyName(id: number): string {
    return this.frequencies.find(f => f.frequencyID == id)?.description ?? 'Unknown';
  }

  getProductPrice(id: number): number {
    const product = this.products.find(p => p.productID === id);
    return product ? 1 : 0;
  }

  deleteContract(contractID: number) {
    if (!confirm("Are you sure you want to delete this contract?")) return;
  
    this.contractService.deleteContract(contractID).subscribe({
      next: () => {
        this.contracts = this.contracts.filter(c => c.contractID !== contractID);
      },
      error: (err) => {
        console.error("Failed to delete contract:", err);
      }
    });
  }

  getTotalOriginalAmount(): number {
    return this.activeContracts.reduce((total, c) => total + (c.originalAmount || 0), 0);
  }
  
  getTotalFinancedAmount(): number {
    return this.activeContracts.reduce((total, c) => total + (c.financedAmount || 0), 0);
  }
  
  getTotalRunningTotal(): number {
    return this.activeContracts.reduce((total, c) => total + (c.runningTotal || 0), 0);
  }

  // printPdf(): void {
  //   const content = document.getElementById('transaction-summary');
  //   if (!content) return;

  //   window.scrollTo(0, 0);
  //   html2canvas(content, { scale: 2 }).then(canvas => {
  //     const imgData = canvas.toDataURL('image/png');
  //     const pdf = new jsPDF('p', 'mm', 'a4');
  //     const imgProps = pdf.getImageProperties(imgData);
  //     const pdfWidth = pdf.internal.pageSize.getWidth();
  //     const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  //     pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  //     pdf.save('Franchisee-Transactions.pdf');
  //   });
  // }
  printPdf(): void {
  const content = document.getElementById('transaction-summary');
  if (!content) return;

  window.scrollTo(0, 0);
  html2canvas(content, { scale: 2 }).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Add more pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save('Franchisee-Transactions.pdf');
  });
}
}
// This code is part of a larger Angular application that manages monthly transactions for franchisees.
// It includes a component that allows users to filter transactions by vendor, group them by month, 