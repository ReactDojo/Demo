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

  groupedTransactions: { [key: string]: MonthlyAccountTransaction[] } = {};
  groupedKeys: string[] = [];

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private vendorService: VendorService,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      vendorID: [null]
    });

    this.vendorService.getVendors().subscribe(v => (this.vendors = v));
    this.customerService.getCustomers().subscribe(c => (this.customers = c));
  }

  onVendorChange(): void {
    const vendorId = this.filterForm.get('vendorID')?.value;
    if (!vendorId) return;

    this.transactionService.getTransactionsByVendor(vendorId).subscribe(tx => {
      this.transactions = tx.sort((a, b) =>
        new Date(a.periodEndDate).getTime() - new Date(b.periodEndDate).getTime()
      );

      this.preloadCustomerNames();
      this.groupTransactions();
    });
  }
preloadCustomerNames(): void {
  const uniqueIds = Array.from(new Set(this.transactions.map(t => t.customerID)));
  console.log('💡 Unique customer IDs found in transactions:', uniqueIds);

  uniqueIds.forEach(id => {
    if (!this.customerNameMap.has(id)) {
      console.log(`🔍 Fetching customer name for ID: ${id}`);

      this.customerService.getCustomer(id.toString()).subscribe({
        next: customer => {
          const name = customer?.DisplayName || customer?.displayName || 'Unknown';
          console.log(`✅ Retrieved name for ID ${id}: ${name}`);
          this.customerNameMap.set(id, name);
        },
        error: (err) => {
          console.error(`❌ Failed to fetch customer for ID ${id}:`, err);
          this.customerNameMap.set(id, 'Unknown');
        }
      });
    } else {
      console.log(`⚠️ Customer ID ${id} already cached`);
    }
  });
}


  groupTransactions(): void {
    this.groupedTransactions = {};
    for (const tx of this.transactions) {
      const date = new Date(tx.periodEndDate);
      const key = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;

      if (!this.groupedTransactions[key]) {
        this.groupedTransactions[key] = [];
      }
      this.groupedTransactions[key].push(tx);
    }

    this.groupedKeys = Object.keys(this.groupedTransactions).sort(
      (a, b) =>
        new Date(this.groupedTransactions[a][0].periodEndDate).getTime() -
        new Date(this.groupedTransactions[b][0].periodEndDate).getTime()
    );
  }

  getCustomerName(customerId: number): string {
  return this.customerNameMap.get(customerId) || 'Loading...';
  }

  printPdf(): void {
    const content = document.getElementById('transaction-summary');
    if (!content) return;

    window.scrollTo(0, 0);
    html2canvas(content, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('Franchisee-Transactions.pdf');
    });
  }
}
// This code is part of a larger Angular application that manages monthly transactions for franchisees.
// It includes a component that allows users to filter transactions by vendor, group them by month, 