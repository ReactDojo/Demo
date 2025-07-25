import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ContractService } from 'src/app/services/contract.service';
import { ProductService } from 'src/app/services/product.service';
import { FrequencyService } from 'src/app/services/frequency.service';
import { CustomerService } from 'src/app/services/customer.service';
import { VendorService } from 'src/app/services/vendor.service';
import { AccountService } from 'src/app/services/account.service';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { Account } from 'src/app/models/account.model';
import { Contract } from 'src/app/models/contract.model';
import { Vendor } from 'src/app/models/vendor.model';
import { Customer } from 'src/app/customer/customer.model';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { Product } from '../models/product.model';
import { Frequency } from '../models/frequency.model';
import { RoyaltyService } from '../Royalty/royalty.service';
import { forkJoin } from 'rxjs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import html2pdf from 'html2pdf.js';

export interface DisplayAccount extends Account {
  customerName: string;
  frequencyName: string;
  frequencyMonthlyMultiplier: number;
  productDuration: number;
  linePayment: number;
  calculatedRoyalty: number;
  promissoryCost: number;
}

@Component({
  selector: 'app-contracts-table',
  templateUrl: './contracts-table.component.html',
  styleUrls: ['./contracts-table.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgSelectModule, ToastrModule],
})
export class ContractsTableComponent implements OnInit {
  billPrivateNote: string
  calendarRefreshTrigger = 0;
  filterForm: FormGroup;
  contracts: Contract[] = [];
  vendors: Vendor[] = [];
  customers: Customer[] = [];
  selectedVendorId: string | null = null;
  filteredContracts: Contract[] = [];
  displayAccounts: DisplayAccount[] = [];
  accounts: Account[] = [];
  products:Product[] = [];
  frequencies:Frequency[] = [];
  totalMonthlyFeeFromServer: number = 0;
  frequencyMultiplierMap: { [key: number]: number } = {
    1: 1,
    2: 2,
    3: 4,
    4: 8,
    5: 12
  };
  newAccount: Account = {
    customerID: 0,
    startDate: '',
    endDate: '',
    monthlyBilling: 0,
    royaltyFee: 0,
    balance: 0,
    supplierID: 0
  };
  totals = {
    netPayment: 0,
    royaltyFee: 0,
    promissoryPayment: 0,
    gst: 0,
    subtotal: 0,
    finalTotal: 0
  };

  constructor(
    private fb: FormBuilder,
    private contractService: ContractService,
    private vendorService: VendorService,
    private customerService: CustomerService,
    private accountService: AccountService,
    private frequencyService: FrequencyService,
    private toastr: ToastrService,
    private productService: ProductService,
    private royaltyService: RoyaltyService
    
  ) {
    this.filterForm = this.fb.group({
      vendorID: [null]
    });
  }

  ngOnInit(): void {
    this.loadVendors();
    this.loadCustomers();
    this.loadProducts();
    this.loadFrequencies();
    const now = new Date();
    this.newAccount.startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    
    .toISOString()
    .split('T')[0];
    
    this.billPrivateNote = `Franchisee billing for ${this.getCurrentBillingPeriodString()}`;

    this.newAccount.endDate = new Date(now.getFullYear(), now.getMonth(), 0)
    .toISOString()
    .split('T')[0];
  }

  getCurrentBillingPeriodString(): string {
    const now = new Date();
    const month = now.toLocaleString('default', { month: 'long' });
    const year = now.getFullYear();
    return `${month} ${year}`;
  }

  toggleVisit(account: any, day: number): void {
    if (!account.startDate || !account.endDate || day === 0) return;
  
    const date = new Date(new Date(account.startDate).getFullYear(), new Date(account.startDate).getMonth(), day);
    const dateKey = date.toISOString().split('T')[0];
  
    account.selectedDays = account.selectedDays || [];
  
    const index = account.selectedDays.indexOf(dateKey);
    if (index >= 0) {
      account.selectedDays.splice(index, 1); // remove
    } else {
      account.selectedDays.push(dateKey); // add
    }
  
    account.numberOfVisits = account.selectedDays.length;
  }

  trackByCalendarRefresh = (index: number, item: any) => {
    return index + this.calendarRefreshTrigger;
  };

  onDateChange(account: any, newDate: string, field: 'startDate' | 'endDate') {
    account[field] = newDate;
    this.calendarRefreshTrigger++;
  }
  
  getMiniCalendar(account: any): { day: number, isActive: boolean, isDisabled: boolean, selected: boolean }[] {
    if (!account.startDate || !account.endDate || !account.daysOfWeek) return [];
  
    function normalize(date: Date): Date {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }
  
    function parseDateLocal(dateStr: string): Date {
      const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
      return new Date(year, month - 1, day);
    }
  
    const startDate = normalize(parseDateLocal(account.startDate));
    const endDate = normalize(parseDateLocal(account.endDate));
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
  
    const activeWeekdays = account.daysOfWeek.toLowerCase().split(',').map(day => day.trim());
  
    account.selectedDays = account.selectedDays || [];
    account.numberOfVisits = account.numberOfVisits ?? 0;
  
    const calendar: { day: number, isActive: boolean, isDisabled: boolean, selected: boolean }[] = [];
  
    const paddingDays = new Date(year, month, 1).getDay();
    for (let i = 0; i < paddingDays; i++) {
      calendar.push({ day: 0, isActive: false, isDisabled: false, selected: false });
    }
  
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = normalize(new Date(year, month, i));
      const weekday = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  
      const isAfterEnd = currentDate > endDate;
      const isBeforeStart = currentDate < startDate;
      const isDisabled = isAfterEnd || isBeforeStart;
      const isMatchingDay = activeWeekdays.includes(weekday);
      const isActive = !isDisabled && isMatchingDay;
  
      const dateKey = currentDate.toISOString().split('T')[0];
      const selected = account.selectedDays.includes(dateKey);
  
      calendar.push({ day: i, isActive, isDisabled, selected });
    }
  
    return calendar;
  }

  calculateBalance(account: Account): number {
    if (account.monthlyBilling < 0) {
      return (account.balance || 0) + account.monthlyBilling;
    }
  
    const multiplier = this.frequencyMultiplierMap[account.frequencyID ?? 1] || 1;
    const monthlyBilling = account.monthlyBilling || 0;
    const pricePerVisit = +(monthlyBilling / multiplier).toFixed(2);
  
    const visitCount = this.calculateDaysMatched(account.startDate, account.endDate, account.daysOfWeek);
    const royalty = account.royaltyFee || 0;
  
    return +(visitCount * pricePerVisit + royalty).toFixed(2);
  }
  
  calculateDaysMatched(startDate: string, endDate: string, daysOfWeek: string | null): number {
    if (!daysOfWeek) return 0;

    const dayMap: { [key: string]: number } = {
      Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6
    };

    const selectedDays = daysOfWeek.split(',').map(d => dayMap[d.trim()]);
    let matchCount = 0;
    let current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      if (selectedDays.includes(current.getDay())) {
        matchCount++;
      }
      current.setDate(current.getDate() + 1);
    }

    return matchCount;
  }
  
  loadProducts(): void {
    this.productService.getProducts().subscribe(products => {
      this.products = products;
    });
  }

  loadFrequencies(): void {
    this.frequencyService.getFrequencies().subscribe(frequencies => {
      this.frequencies = frequencies;
    });
  }

  loadVendors(): void {
    this.vendorService.getVendors().subscribe({
      next: (vendors) => {
        this.vendors = vendors;
      },
      error: (error) => {
        this.toastr.error('Failed to load vendors', 'Error');
      }
    });
  }

  submitFranchiseeBill(): void {
    if (!this.selectedVendorId) {
      this.toastr.error('No vendor selected');
      return;
    }

    const today = new Date();
    const billDate = today.toISOString().split('T')[0];

    const billJson = {
      VendorRef: { value: this.selectedVendorId.toString() },
      TxnDate: billDate,
      DueDate: billDate,
      DocNumber: `Franchisee-${today.toLocaleString('default', { month: 'long' })}-${today.getFullYear()}`,
      PrivateNote: this.billPrivateNote,
      GlobalTaxCalculation: "TaxExcluded",
      Line: [
        {
          DetailType: "AccountBasedExpenseLineDetail",
          Amount: Math.abs(this.totals.promissoryPayment),
          Description: "Services rendered",
          AccountBasedExpenseLineDetail: {
            AccountRef: { value: "16", name: "Subcontractors - COS" },
            TaxCodeRef: { value: "3", name: "GST" }
          }
        },
        {
          DetailType: "AccountBasedExpenseLineDetail",
          Amount: Math.abs(this.totals.royaltyFee),
          Description: `Royalty fee of ${this.newAccount.royaltyFee}%`,
          AccountBasedExpenseLineDetail: {
            AccountRef: { value: "48", name: "Royalty Expense" },
            TaxCodeRef: { value: "3", name: "GST" }
          }
        },
        {
          DetailType: "AccountBasedExpenseLineDetail",
          Amount: Math.abs(this.totals.promissoryPayment),
          Description: "Franchisee offset",
          AccountBasedExpenseLineDetail: {
            AccountRef: { value: "56", name: "Franchisee Offset" },
            TaxCodeRef: { value: "3", name: "GST" }
          }
        }
      ]
    };

    fetch("http://localhost/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(billJson)
    })
    .then(res => res.ok ? res.json() : Promise.reject(res))
    .then(() => {
      this.toastr.success("✅ Franchisee Bill submitted to QuickBooks");
      const periodEndDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split("T")[0];
      const transactionPromises = this.displayAccounts.map(account => {
        const transaction = { ...account, periodEndDate };
        return fetch("http://localhost/api/monthlytransactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(transaction)
        }).then(res => res.ok ? res.json() : Promise.reject(res));
      });
      return Promise.all(transactionPromises);
    })
    .then(() => {
      this.toastr.success("✅ All monthly transactions saved to DB");
    })
    .catch(err => {
      this.toastr.error("Something failed during QuickBooks or DB sync");
    });
  }

  loadCustomers(): void {
    this.customerService.getCustomers().subscribe(customers => {
      this.customers = customers;
    });
  }

  onVendorChange(): void {
    const vendorId = this.filterForm.get('vendorID')?.value;
    this.selectedVendorId = vendorId;

    if (!vendorId) {
      this.displayAccounts = [];
      this.recalculateTotals();
      return;
    }

    forkJoin({
      contracts: this.contractService.getContractsByVendor(vendorId),
      accounts: this.accountService.getAccountsByVendor(vendorId),
      royalty: this.royaltyService.getRoyaltyByVendorId(vendorId)
    }).subscribe(({ contracts, accounts, royalty }) => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

      this.newAccount.royaltyFee = royalty.royaltyFee;
      this.filteredContracts = contracts;

      this.displayAccounts = accounts.map(account => {
        const displayAccount = {
          ...account,
          startDate: monthStart,
          endDate: monthEnd,
          customerName: this.getCustomerName(account.customerID),
          frequencyName: this.getFrequencyName(account.frequencyID),
          frequencyMonthlyMultiplier: this.getFrequencyMonthly(account.frequencyID || 0),
          productDuration: this.getProductName(account.productID),
          promissoryCost: this.getMonthlyPaymentByCustomer(account.customerID)
        } as DisplayAccount;

        displayAccount.linePayment = this.calculateLinePayment(displayAccount);
        displayAccount.calculatedRoyalty = this.calculateRoyalty(displayAccount);
        displayAccount.balance = this.calculateBalance(displayAccount);

        return displayAccount;
      });

      this.recalculateTotals();
      this.toastr.success('Vendor data loaded.');
    });
  }

  printForm(): void {
    const content = document.getElementById('pdf-summary');
    if (!content) {
      return;
    }
    window.scrollTo(0, 0);
    html2canvas(content, { scale: 2, useCORS: true, logging: true }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('Franchisee-Summary.pdf');
    });
  }

  updateAccount(account: DisplayAccount): void {
    this.accountService.updateAccount(account).subscribe({
      next: () => {
        this.recalculateTotals();
        this.toastr.success('✅ Account updated successfully.');
      },
      error: () => {
        this.toastr.error('❌ Failed to update account.');
      }
    });
  }
  
  deleteAccount(accountID: number): void {
    if (confirm('Are you sure you want to delete this account?')) {
      this.accountService.deleteAccount(accountID).subscribe({
        next: () => {
          this.displayAccounts = this.displayAccounts.filter(a => a.accountID !== accountID);
          this.recalculateTotals();
          this.toastr.success('✅ Account deleted.');
        },
        error: () => {
          this.toastr.error('❌ Failed to delete account.');
        }
      });
    }
  }

  getDaysOfWeekLabel(daysOfWeek: string | null | undefined): string {
    if (!daysOfWeek) return '';
    return daysOfWeek.split(',').join(', ');
  }
  
  getProductDuration(productID: number | string | undefined): string {
    const product = this.products.find(p => String(p.productID) === String(productID));
    return product ? `${product.durationMonths} months` : 'Unknown';
  }
  
  getFinancedAmountLabel(amount: number | null | undefined): string {
    return amount ? `$${amount.toFixed(2)}` : '$0.00';
  }

  getProductName(productID: number | string): number {
    const product = this.products.find(p => String(p.productID) === String(productID));
    return product ? Number(product.durationMonths) : 0;
  }

  getFrequencyName(frequencyID: number | string): string {
    const match = this.frequencies.find(f => String(f.frequencyID) === String(frequencyID));
    return match ? match.description : 'Unknown';
  }

  getFrequencyMonthly(frequencyID: number | string): number {
    const match = this.frequencies.find(f => String(f.frequencyID) === String(frequencyID));
    return match ? match.monthlyMultiplier : 0;
  }

  addAccount(): void {
    if (!this.selectedVendorId) return;

    const payload: Account = { ...this.newAccount, supplierID: +this.selectedVendorId };

    this.accountService.createAccount(payload).subscribe({
      next: saved => {
        const displayAccount = {
          ...saved,
          customerName: this.getCustomerName(saved.customerID),
          frequencyName: this.getFrequencyName(saved.frequencyID),
          frequencyMonthlyMultiplier: this.getFrequencyMonthly(saved.frequencyID || 0),
          productDuration: this.getProductName(saved.productID),
          promissoryCost: this.getMonthlyPaymentByCustomer(saved.customerID)
        } as DisplayAccount;
        displayAccount.linePayment = this.calculateLinePayment(displayAccount);
        displayAccount.calculatedRoyalty = this.calculateRoyalty(displayAccount);
        this.displayAccounts.push(displayAccount);
        this.recalculateTotals();
        this.toastr.success('Account added successfully.');
      },
      error: () => {
        this.toastr.error('Failed to add account.');
      }
    });
  }

  getCustomerName(customerID: number | string): string {
    const match = this.customers.find(c => String(c.Id) === String(customerID));
    return match ? match.DisplayName : 'Unknown';
  }

  deleteContract(contractID: number): void {
    if (confirm('Are you sure you want to delete this contract?')) {
      this.contractService.deleteContract(contractID).subscribe({
        next: () => {
          this.contracts = this.contracts.filter(c => c.contractID !== contractID);
          this.toastr.success('Contract deleted successfully.');
        },
        error: () => {
          this.toastr.error('Failed to delete contract.');
        }
      });
    }
  }

  recalculateTotals(): void {
    const netPayment = this.displayAccounts.reduce((sum, acc) => sum + acc.linePayment, 0);
    const promissoryPayment = this.displayAccounts.reduce((sum, acc) => sum + (acc.monthlyBilling || 0), 0);
    const royaltyFee = this.displayAccounts.reduce((sum, acc) => sum + acc.calculatedRoyalty, 0);
    const difference = netPayment - promissoryPayment;
    const gst = difference * 0.05;

    this.totals = {
      netPayment,
      promissoryPayment,
      royaltyFee,
      gst,
      subtotal: difference - royaltyFee,
      finalTotal: (difference - royaltyFee) + gst
    };
  }

  onVisitsChange(account: DisplayAccount, value: number): void {
    const maxVisits = this.getFrequencyMonthly(account.frequencyID || 0);
    account.numOfVisits = Math.min(value, maxVisits);
    account.linePayment = this.calculateLinePayment(account);
    account.calculatedRoyalty = this.calculateRoyalty(account);
    this.recalculateTotals();
  }

  calculateLinePayment(account: DisplayAccount): number {
    const royaltyFee = account.royaltyFee || 0;
    const monthlyBilling = account.monthlyPayment - royaltyFee || 0;
    const numOfVisits = account.numOfVisits || 0;
    const monthlyMultiplier = this.getFrequencyMonthly(account.frequencyID || 0) || 1;
    const gross = (monthlyBilling / monthlyMultiplier) * numOfVisits;
    return Math.max(gross, 0);
  }
  
  calculateRoyalty(account: DisplayAccount): number {
    const base = account.linePayment || 0;
    const percentage = this.newAccount.royaltyFee;
    return +(base * (percentage / 100)).toFixed(2);
  }

  applyRoyaltyFeeToAllAccounts(): void {
    const percentage = this.newAccount.royaltyFee;
    this.displayAccounts = this.displayAccounts.map(account => {
      const calculatedRoyalty = +(account.runningTotal * (percentage / 100)).toFixed(2);
      return { ...account, royaltyFee: calculatedRoyalty };
    });
    this.recalculateTotals();
  }
  
  saveAllAccounts(): void {
    if (!this.selectedVendorId) {
      this.toastr.error('No vendor selected.');
      return;
    }
  
    const saveRequests = this.displayAccounts.map(account => {
      return this.accountService.updateAccount(account);
    });
  
    forkJoin(saveRequests).subscribe({
      next: () => {
        this.toastr.success('✅ All accounts saved successfully.');
      },
      error: () => {
        this.toastr.error('Failed to save accounts.');
      }
    });
  }

  getMonthlyPaymentByCustomer(customerId: number): number {
    const match = this.filteredContracts.find(c => c.customerID === customerId);
    return match?.monthlyPayment ?? 0;
  }

  loadTotalMonthlyFeeFromServer(supplierId: number) {
    this.contractService.getTotalMonthlyPaymentBySupplier(supplierId).subscribe({
      next: (total) => {
        this.totalMonthlyFeeFromServer = total;
      },
      error: () => {
        this.totalMonthlyFeeFromServer = 0;
      }
    });
  }

  get totalContracts(): number {
    return this.contracts.length;
  }
}