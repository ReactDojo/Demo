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

// interface Account {
//   accountID?: number;
//   customerID: number;
//   startDate: string;
//   endDate: string;
//   monthlyBilling: number;
//   royaltyFee: number;
//   balance: number;
//   supplierID: number;
//   frequencyID?: number;
//   contractID?: number;
//   originalAmount?: number;
// }

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
  filteredAccounts: Account[] = [];
  accounts:Account[] = [];
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


    // Get last day of previous month
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
    //console.log('[trackBy]', index, this.calendarRefreshTrigger);
    return index + this.calendarRefreshTrigger;
  };
  onDateChange(account: any, newDate: string, field: 'startDate' | 'endDate') {
    console.log(`[onDateChange] Field: ${field}, Value: ${newDate}`);
    account[field] = newDate;
    this.calendarRefreshTrigger++; // triggers change
  }
  
  getMiniCalendar(account: any): { day: number, isActive: boolean, isDisabled: boolean, selected: boolean }[] {
    //console.log('[getMiniCalendar]', account.startDate, account.endDate);
    if (!account.startDate || !account.endDate || !account.daysOfWeek) return [];
  
    // Normalize functions
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
  
    const activeWeekdays = account.daysOfWeek
      .toLowerCase()
      .split(',')
      .map(day => day.trim());
  
    // Ensure selectedDays and numberOfVisits are initialized
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
  
      calendar.push({
        day: i,
        isActive,
        isDisabled,
        selected
      });
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
    console.log('🔄 Fetching vendors...');
  
    this.vendorService.getVendors().subscribe({
      next: (vendors) => {
        console.log('✅ Vendors loaded:', vendors);
        this.vendors = vendors;
      },
      error: (error) => {
        console.error('❌ Failed to load vendors:', error);
        this.toastr.error('Failed to load vendors', 'Error');
      },
      complete: () => {
        console.log('✅ Vendor fetch completed.');
      }
    });
  }
  getTotalRoyaltyFeeForQuickbooks(): number {
    if (!this.accounts || this.accounts.length === 0) return 0;
  
    return this.accounts
      .map(account => account.royaltyFee || 0)
      .reduce((sum, fee) => sum + fee, 0);
  }
  getTotalMonthlyPayment(): number {
    if (!this.accounts || this.accounts.length === 0) return 0;
  
    return this.accounts
      .map(account => account.monthlyPayment || 0)
      .reduce((sum, payment) => sum + payment, 0);
  }
// submitFranchiseeBill(): void {
//   if (!this.selectedVendorId) {
//     this.toastr.error('No vendor selected');
//     return;
//   }

//   const vendor = this.vendors.find(v => v.Id == this.selectedVendorId);
//   const vendorName = vendor?.CompanyName || 'Unknown Supplier';

//   const today = new Date();
//   const billDate = today.toISOString().split('T')[0];
//   const periodEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

//   const billJson = {
//     VendorRef: { value: this.selectedVendorId.toString() },
//     TxnDate: billDate,
//     DueDate: billDate,
//     DocNumber: `Franchisee-${today.toLocaleString('default', { month: 'long' })}-${today.getFullYear()}`,
//     PrivateNote: this.billPrivateNote,
//     GlobalTaxCalculation: "TaxExcluded",
//     Line: [
//       {
//         DetailType: "AccountBasedExpenseLineDetail",
//         Amount: Math.abs(this.getTotalMonthlyPayment()),
//         Description: "Services rendered",
//         AccountBasedExpenseLineDetail: {
//           AccountRef: { value: "16", name: "Subcontractors - COS" },
//           TaxCodeRef: { value: "3", name: "GST" }
//         }
//       },
//       {
//         DetailType: "AccountBasedExpenseLineDetail",
//         Amount: Math.abs(this.getTotalRoyaltyFeeForQuickbooks()),
//         Description: `Royalty fee of ${this.newAccount.royaltyFee}%`,
//         AccountBasedExpenseLineDetail: {
//           AccountRef: { value: "48", name: "Royalty Expense" },
//           TaxCodeRef: { value: "3", name: "GST" }
//         }
//       },
//       {
//         DetailType: "AccountBasedExpenseLineDetail",
//         Amount: Math.abs(this.getTotalMonthlyBilling()),
//         Description: "Franchisee offset",
//         AccountBasedExpenseLineDetail: {
//           AccountRef: { value: "56", name: "Franchisee Offset" },
//           TaxCodeRef: { value: "3", name: "GST" }
//         }
//       }
//     ]
//   };

//  fetch("http://localhost/api/bills", {
//   method: "POST",
//   headers: { "Content-Type": "application/json" },
//   body: JSON.stringify(billJson)
// })
//   .then(res => res.ok ? res.json() : Promise.reject(res))
//   .then(billResult => {
//     this.toastr.success("✅ Franchisee Bill submitted to QuickBooks");

//     // Loop through all accounts and POST each transaction
//     const periodEndDate = new Date(
//       new Date().getFullYear(),
//       new Date().getMonth() + 1,
//       0
//     ).toISOString().split("T")[0];

//     const transactionPromises = this.accounts.map(account => {
//       const transaction = {
//         accountID: account.accountID,
//         customerID: account.customerID,
//         frequencyID: account.frequencyID,
//         startDate: account.startDate,
//         endDate: account.endDate,
//         monthlyBilling: account.monthlyBilling,
//         supplierID: account.supplierID,
//         contractID: account.contractID,
//         originalAmount: account.originalAmount,
//         daysOfWeek: account.daysOfWeek,
//         financedAmount: account.financedAmount,
//         productID: account.productID,
//         numOfVisits: account.numOfVisits,
//         royaltyFee: account.royaltyFee,
//         monthlyPayment: account.monthlyPayment,
//         runningTotal: account.runningTotal,
//         periodEndDate: periodEndDate
//       };

//       return fetch("http://localhost/api/monthlytransactions", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(transaction)
//       }).then(res => res.ok ? res.json() : Promise.reject(res));
//     });

//     // Wait for all transactions to finish
//     return Promise.all(transactionPromises);
//   })
//   .then(results => {
//     this.toastr.success("✅ All monthly transactions saved to DB");
//   })
//   .catch(err => {
//     console.error("❌ Error during bill or transaction process:", err);
//     this.toastr.error("Something failed during QuickBooks or DB sync");
//   });
// }
submitFranchiseeBill(): void {
  if (!this.selectedVendorId) {
    this.toastr.error('No vendor selected');
    return;
  }

  const vendor = this.vendors.find(v => v.Id == this.selectedVendorId);
  const vendorName = vendor?.CompanyName || 'Unknown Supplier';

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
        Amount: Math.abs(this.getTotalMonthlyPayment()),
        Description: "Services rendered",
        AccountBasedExpenseLineDetail: {
          AccountRef: { value: "16", name: "Subcontractors - COS" },
          TaxCodeRef: { value: "3", name: "GST" }
        }
      },
      {
        DetailType: "AccountBasedExpenseLineDetail",
        Amount: Math.abs(this.getTotalRoyaltyFeeForQuickbooks()),
        Description: `Royalty fee of ${this.newAccount.royaltyFee}%`,
        AccountBasedExpenseLineDetail: {
          AccountRef: { value: "48", name: "Royalty Expense" },
          TaxCodeRef: { value: "3", name: "GST" }
        }
      },
      {
        DetailType: "AccountBasedExpenseLineDetail",
        Amount: Math.abs(this.getTotalMonthlyBilling()),
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
    .then(billResult => {
      this.toastr.success("✅ Franchisee Bill submitted to QuickBooks");
      return this.postMonthlyTransactions();
    })
    .then(() => {
      this.toastr.success("✅ All monthly transactions saved to DB");
    })
    .catch(err => {
      console.error("❌ Error during bill or transaction process:", err);
      this.toastr.error("Something failed during QuickBooks or DB sync");
    });
}

postMonthlyTransactions(): Promise<void> {
  const periodEndDate = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  ).toISOString().split("T")[0];

  const transactionPromises = this.accounts.map(account => {
    const transaction = {
      accountID: account.accountID,
      customerID: account.customerID,
      frequencyID: account.frequencyID,
      startDate: account.startDate,
      endDate: account.endDate,
      monthlyBilling: account.monthlyBilling,
      supplierID: account.supplierID,
      contractID: account.contractID,
      originalAmount: account.originalAmount,
      daysOfWeek: account.daysOfWeek,
      financedAmount: account.financedAmount,
      productID: account.productID,
      numOfVisits: account.numOfVisits,
      royaltyFee: account.royaltyFee,
      monthlyPayment: account.monthlyPayment,
      runningTotal: account.runningTotal,
      periodEndDate: periodEndDate
    };

    return fetch("http://localhost/api/monthlytransactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transaction)
    }).then(res => res.ok ? res.json() : Promise.reject(res));
  });

  return Promise.all(transactionPromises).then(() => {});
}

updateContractsAfterBill(): void {
  this.accounts.forEach(account => {
    if (!account.contractID) {
      console.warn(`⚠️ Missing contractID for account with customerID: ${account.customerID}`);
      return;
    }

    const updatedContract: Contract = {
      contractID: account.contractID,
      supplierID: account.supplierID,
      customerID: account.customerID,
      productID: account.productID,
      frequencyID: account.frequencyID,
      startDate: account.startDate,
      endDate: account.endDate,
      originalAmount: account.originalAmount,
      notes: '',

      // Reduce financedAmount by monthlyPayment
      financedAmount: Math.max((account.financedAmount || 0) - (account.monthlyPayment || 0), 0),

      // Decrease paymentOnProduct by 1
      paymentOnProduct: Math.max((account.paymentOnProduct || 0) - 1, 0),

      // Optional fields preserved if needed
      runningTotal: account.runningTotal,
      contractData: account.contractData,
      daysOfWeek: account.daysOfWeek,
      downpayment: account.downpayment,
      customermonthlyamount: account.customermonthlyamount,
      monthlyPayment: account.monthlyPayment
    };

    this.contractService.updateContract(account.contractID, updatedContract).subscribe({
      next: () => console.log(`✅ Contract ${account.contractID} updated successfully`),
      error: err => console.error(`❌ Failed to update contract ${account.contractID}`, err)
    });
  });
}




  
  loadCustomers(): void {
    this.customerService.getCustomers().subscribe(customers => {
      this.customers = customers;
    });
  }

  onVendorChange(): void {
    const vendorId = this.filterForm.get('vendorID')?.value;
    console.log('🟡 Vendor selected:', vendorId);
    
    const supplierId = this.filterForm.value.vendorID;
    if (supplierId) {
      this.loadTotalMonthlyFeeFromServer(supplierId);
    }
    if (!vendorId) {
      console.warn('⚠️ No vendor ID selected. Aborting fetch.');
      return;
    }
  
    this.selectedVendorId = vendorId;
    console.log('📦 Fetching contracts, accounts, and royalty for vendor ID:', vendorId);
  
    forkJoin({
      contracts: this.contractService.getContractsByVendor(vendorId),
      accounts: this.accountService.getAccountsByVendor(vendorId),
      royalty: this.royaltyService.getRoyaltyByVendorId(vendorId)
    }).subscribe({
      next: ({ contracts, accounts, royalty }) => {
        // console.log('✅ All vendor data loaded');
        // console.log('📄 Contracts:', contracts);
        // console.log('📄 Accounts:', accounts);
        // console.log('📄 Royalty:', royalty);
  
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
        const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
        
  
        this.filteredContracts = contracts;
        this.accounts = accounts.map(account => {
          const updated = {
            ...account,
            startDate: monthStart,
            endDate: monthEnd,
            royaltyFee: +(account.monthlyBilling * (royalty.royaltyFee / 100)).toFixed(2)
          };
          updated.numOfVisits = updated.numOfVisits ?? 0;
          return {
            ...updated,
            balance: this.calculateBalance(updated)
          };
        });
  
        this.filteredAccounts = [...this.accounts];
  
        this.newAccount.royaltyFee = royalty.royaltyFee;
        this.newAccount.startDate = monthStart;
        this.newAccount.endDate = monthEnd;
        this.newAccount.supplierID = +vendorId;
        this.newAccount = { ...this.newAccount }; // trigger rebind

        this.applyRoyaltyFeeToAllAccounts();
      },
      error: (err) => {
        console.error('❌ Failed to load vendor data: check if Royalty is set-up for the vendor', err);
        this.toastr.error('Failed to load vendor data. check if Royalty is set-up for the vendor');
        this.newAccount.royaltyFee = 0;
        this.newAccount = { ...this.newAccount };
      }
    });
  }
  
 

  printForm(): void {
    const content = document.getElementById('pdf-summary');
    if (!content) {
      console.error('🛑 #pdf-summary element not found.');
      return;
    }
  
    // Scroll to top so it renders correctly
    window.scrollTo(0, 0);
  
    html2canvas(content, {
      scale: 2,
      useCORS: true,
      logging: true
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('Franchisee-Summary.pdf');
    }).catch(error => {
      console.error("❌ Error generating PDF:", error);
    });
  }

  updateAccount(account: Account): void {
    console.log('🛠️ Attempting to update account:', account);
    this.accountService.updateAccount(account).subscribe({
      next: () => {
        this.toastr.success('✅ Account updated successfully.');
      },
      error: (err) => {
        console.error('❌ Update failed:', err);
        this.toastr.error('❌ Failed to update account.');
      }
    });
  }
  
  deleteAccount(accountID: number): void {
    console.log('🗑️ Attempting to delete account:', accountID);
    if (confirm('Are you sure you want to delete this account?')) {
      this.accountService.deleteAccount(accountID).subscribe({
        next: () => {
          this.accounts = this.accounts.filter(a => a.accountID !== accountID);
          this.toastr.success('✅ Account deleted.');
        },
        error: (err) => {
          console.error('❌ Delete failed:', err);
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

    const payload: Account = {
      ...this.newAccount,
      supplierID: +this.selectedVendorId
    };

    this.accountService.createAccount(payload).subscribe({
      next: saved => {
        this.filteredAccounts.push(saved);
        this.toastr.success('Account added successfully.');
        this.newAccount = {
          customerID: 0,
          startDate: '',
          endDate: '',
          monthlyBilling: 0,
          royaltyFee: 0,
          balance: 0,
          supplierID: +this.selectedVendorId
        };
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
  getTotalMonthlyBilling(): number {
    return this.filteredAccounts.reduce((total, account) => {
      return total + (account.monthlyBilling || 0);
      
    }, 0);
  }
  getGSTDifference(gstRate: number = 0.05): number {
    const net = this.getTotalNetPayment();
    const promissory = this.getTotalMonthlyBilling();
    const difference = net - promissory;
    const gstAmount = difference * gstRate;
    
    return gstAmount;
  }
  getGSTDifferenceTotal(gstRate: number = 0.05): number {
    const net = this.getTotalNetPayment();
    const promissory = this.getTotalMonthlyBilling();
    const difference = net - promissory;
    const gstAmount = difference * gstRate;
    return difference + gstAmount;
  }
  getTotalMonthlyFee(): number {
    return this.filteredContracts.reduce((total, contract) => {
      const duration = this.getProductName(contract.productID);
      const originalAmount = contract.financedAmount || 0;
      const monthlyFee = duration > 0 ? originalAmount / duration : 0;
      return total + monthlyFee;
    }, 0);
  }
  onVisitsChange(account: Account, value: number): void {
    const maxVisits = this.getFrequencyMonthly(account.frequencyID || 0);
    account.numOfVisits = Math.min(value, maxVisits);
  }
  calculateLinePayment(account: Account): number {
    const royaltyFee = account.royaltyFee || 0;
    const monthlyBilling = account.monthlyPayment - royaltyFee || 0;
    const numOfVisits = account.numOfVisits || 0;
    const monthlyMultiplier = this.getFrequencyMonthly(account.frequencyID || 0) || 1;
    const gross = (monthlyBilling / monthlyMultiplier) * numOfVisits;
    const net = gross;
  
    // console.log(`🧾 Calculating Line Payment for Account ${account.accountID || '(no ID)'}`);
    // console.log(` - Monthly Payment: ${monthlyBilling}`);
    // console.log(` - Num of Visits: ${numOfVisits}`);
    // console.log(` - Frequency ID: ${account.frequencyID}`);
    // console.log(` - Monthly Multiplier: ${monthlyMultiplier}`);
    // console.log(` - Gross: ${gross.toFixed(2)}`);
    // console.log(` - Royalty Fee: ${royaltyFee}`);
    // console.log(` - Net Payment: ${net.toFixed(2)}`);
    //console.log(` - Net Payment: ${net.toFixed(2)}`);
    return Math.max(net, 0);
  }
  
  getTotalNetPayment(): number {
    return this.accounts.reduce((total, a) => total + this.calculateLinePayment(a), 0);
  }
  
   calculateRoyalty(account: Account): number {
    const royaltyFee = account.royaltyFee || 0;
    const monthlyBilling = account.monthlyPayment - royaltyFee || 0;
    const numOfVisits = account.numOfVisits || 0;
    const monthlyMultiplier = this.getFrequencyMonthly(account.frequencyID || 0) || 1;
    const gross = (monthlyBilling / monthlyMultiplier) * numOfVisits;
    const net = gross;
   const base = net || 0;

   const percentage = this.newAccount.royaltyFee;
     const calculatedRoyalty = +(base * (percentage / 100)).toFixed(2);
    console.log(`Account ${account.accountID}: Balance ${base}, Royalty ${calculatedRoyalty}`);

    return calculatedRoyalty
    ;
    // console.log(`🧾 Calculating Line Payment for Account ${account.accountID || '(no ID)'}`);
    // console.log(` - Monthly Payment: ${monthlyBilling}`);
    // console.log(` - Num of Visits: ${numOfVisits}`);
    // console.log(` - Frequency ID: ${account.frequencyID}`);
    // console.log(` - Monthly Multiplier: ${monthlyMultiplier}`);
    // console.log(` - Gross: ${gross.toFixed(2)}`);
    // console.log(` - Royalty Fee: ${royaltyFee}`);
    // console.log(` - Net Payment: ${net.toFixed(2)}`);
    //console.log(` - Net Payment: ${net.toFixed(2)}`);

  }

  applyRoyaltyFeeToAllAccounts(): void {

  
  const percentage = this.newAccount.royaltyFee;
  console.log('Applying royalty % on runningTotal:', percentage);

  this.accounts = this.accounts.map(account => {
    const base = account.runningTotal || 0;
    const calculatedRoyalty = +(base * (percentage / 100)).toFixed(2);
    console.log(`Account ${account.accountID}: Balance ${base}, Royalty ${calculatedRoyalty}`);

    return {
      ...account,
      royaltyFee: calculatedRoyalty
    };
  });

  this.filteredAccounts = [...this.accounts];
}

  
  
  
  
  saveAllAccounts(): void {
    if (!this.selectedVendorId) {
      this.toastr.error('No vendor selected.');
      return;
    }
  
    const saveRequests = this.accounts.map(account => {
      return this.accountService.updateAccount(account); // assume updateAccount API exists
    });
  
    forkJoin(saveRequests).subscribe({
      next: () => {
        this.toastr.success('✅ All accounts saved successfully.');
      },
      error: (err) => {
        console.error('❌ Failed to save accounts:', err);
        this.toastr.error('Failed to save accounts.');
      }
    });
  }

getMonthlyPaymentByCustomer(customerId: number): number {
  console.log(`🔍 Searching for customer ID: ${customerId} in filteredContracts`);

  const match = this.filteredContracts.find(c => c.customerID === customerId);

  if (match) {
    console.log(`✅ Match found for customer ID ${customerId}:`);
    console.table(match); // 🔍 logs all fields in a table format
  } else {
    console.warn(`⚠️ No contract found for customer ID: ${customerId}`);
  }

  return match?.monthlyPayment ?? 0;
}

  getTotalRunningTotal(): number {
    return this.filteredContracts.reduce((total, contract) => total + (contract.financedAmount || 0), 0);
  }

  getTotalOriginalAmount(): number {
    return this.filteredContracts.reduce((total, contract) => total + (contract.originalAmount || 0), 0);
  }

  loadTotalMonthlyFeeFromServer(supplierId: number) {
    this.contractService.getTotalMonthlyPaymentBySupplier(supplierId).subscribe({
      next: (total) => {
        this.totalMonthlyFeeFromServer = total;
      },
      error: (err) => {
        console.error('❌ Error loading server-side total monthly fee:', err);
        this.totalMonthlyFeeFromServer = 0;
      }
    });
  }
  getTotalAccountMonthly(): number {
    return this.filteredAccounts.reduce((total, a) => total + (a.monthlyBilling || 0), 0);
  }

  getTotalRoyaltyFee(): number {
    return this.filteredAccounts.reduce((total, a) => total + (a.royaltyFee || 0), 0);
  }

  getTotalBalance(): number {
    return this.filteredAccounts.reduce((total, a) => total + (a.balance || 0), 0);
  }

  get totalContracts(): number {
    return this.contracts.length;
  }
}
