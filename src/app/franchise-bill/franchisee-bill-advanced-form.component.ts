import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-franchisee-bill-advanced-form',
  standalone: true, // ✅ If you're using a standalone component
  imports: [CommonModule, ReactiveFormsModule], // ✅ Required for formGroup/formControlName
  templateUrl: './franchisee-bill-advanced-form.component.html'
})
export class FranchiseeBillAdvancedFormComponent {
  @Output() formSubmit = new EventEmitter<any>();
  billForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.billForm = this.fb.group({
      billNo: ['', Validators.required],
      vendorRef: ['', Validators.required],
      billDate: ['', Validators.required],
      dueDate: ['', Validators.required],
      terms: [''],
      memo: [''],
      lineItems: this.fb.array([])
    });

    this.addLineItem();
  }

  get lineItems(): FormArray {
    return this.billForm.get('lineItems') as FormArray;
  }

  addLineItem() {
    this.lineItems.push(this.fb.group({
      categoryAccountRef: ['', Validators.required],
      description: ['', Validators.required],
      amount: [0, Validators.required],
      salesTax: [''],
      classRef: ['']
    }));
  }

  removeLineItem(index: number) {
    this.lineItems.removeAt(index);
  }

  submit() {
    if (this.billForm.valid) {
      this.formSubmit.emit(this.billForm.value);
    }
  }
}
