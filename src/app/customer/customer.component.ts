import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomerService } from '../services/customer.service';
import { Customer } from './customer.model';

@Component({
  selector: 'app-customer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // ✅ Required for [formGroup]
  templateUrl: 'customer.component.html',
})
export class CustomerComponent implements OnInit {
  customers: Customer[] = [];
  customerForm!: FormGroup;
  editingId: number | null = null;

  constructor(
    private customerService: CustomerService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCustomers();
  }

  initForm() {
    this.customerForm = this.fb.group({
      displayName: ['', Validators.required],
      givenName: [''],
      familyName: [''],
      primaryEmailAddr: ['', [Validators.email]],
      primaryPhone: [''],
      companyName: [''],
      notes: ['']
    });
  }

  loadCustomers() {
    this.customerService.getCustomers().subscribe(data => {
      this.customers = data;
    });
  }

  submitForm() {
    const formData = this.customerForm.value;

    if (this.editingId) {
      this.customerService.updateCustomer(this.editingId.toString(), formData).subscribe(() => {
        this.loadCustomers();
        this.resetForm();
      });
    } else {
      this.customerService.createCustomer(formData).subscribe(() => {
        this.loadCustomers();
        this.resetForm();
      });
    }
  }

  edit(customer: Customer) {
    this.editingId = customer.customerID!;
    this.customerForm.patchValue(customer);
  }

  resetForm() {
    this.editingId = null;
    this.customerForm.reset();
  }
}
