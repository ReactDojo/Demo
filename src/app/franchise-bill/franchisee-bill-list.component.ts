import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AsyncPipe, CurrencyPipe, NgIf, NgFor } from '@angular/common';
import { FranchiseeBillService } from './franchisee-bill.service';

@Component({
  selector: 'app-franchisee-bill-list',
  templateUrl: './franchisee-bill-list.component.html',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    AsyncPipe,
    CurrencyPipe
  ]
})
export class FranchiseeBillListComponent implements OnInit {
  bills$: Observable<any>;
  loading = false;

  constructor(private billService: FranchiseeBillService) {}

  ngOnInit(): void {
    this.loadBills();
  }

  loadBills(): void {
    this.loading = true;
    this.bills$ = this.billService.getBills();
    this.bills$.subscribe(() => (this.loading = false));
  }
  getTotalBeforeTax(bill: any): number {
    if (!bill?.Line || !Array.isArray(bill.Line)) return 0;
    return bill.Line.reduce((sum: number, line: any) => sum + (line.Amount || 0), 0);
  }
  
  editBill(bill: any) {
    alert('Edit clicked for Bill ID: ' + bill.Id);
  }

  markAsPaid(bill: any) {
    alert('Marking as paid: ' + bill.Id);
  }
}