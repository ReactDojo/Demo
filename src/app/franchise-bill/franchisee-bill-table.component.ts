import { Component } from '@angular/core';
import { FranchiseeBillService } from './franchisee-bill.service';

@Component({
  selector: 'app-franchisee-bill-table',
  templateUrl: './franchisee-bill-table.component.html'
})
export class FranchiseeBillTableComponent {
  bills: any[] = [];

  constructor(private billService: FranchiseeBillService) {
    this.loadBills();
  }

  loadBills() {
    this.billService.getBills().subscribe(res => {
      this.bills = res?.QueryResponse?.Bill || [];
    });
  }
}