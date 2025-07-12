// royalty.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastrService, ToastrModule } from 'ngx-toastr';
import { RoyaltyService } from './royalty.service';
import { VendorService } from 'src/app/services/vendor.service';
import { Royalty } from '../models/royalty.model';
import { Vendor } from '../models/vendor.model';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-royalty',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ToastrModule, NgSelectModule],
  templateUrl: './royalty.component.html'
})
export class RoyaltyComponent implements OnInit {
  
  royaltyForm: FormGroup;
  vendors: Vendor[] = [];
  royalties: Royalty[] = [];

  isLoading = false;
  isEditMode = false;
  editingRoyaltyID: number | null = null;

  constructor(
    private fb: FormBuilder,
    private royaltyService: RoyaltyService,
    private vendorService: VendorService,
    private toastr: ToastrService
  ) {
    this.royaltyForm = this.fb.group({
      vendorID: [null, Validators.required],
      royaltyFee: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadVendors();
    this.loadRoyalties();
    console.log('Testing deleteRoyalty():', this.royaltyService.deleteRoyalty);
  }

  loadVendors(): void {
    this.vendorService.getVendors().subscribe(vendors => {
      this.vendors = vendors;
    });
  }

  loadRoyalties(): void {
    this.isLoading = true;
    this.royaltyService.getAll().subscribe({
      next: royalties => {
        this.royalties = royalties;
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('Failed to load royalties');
        this.isLoading = false;
      }
    });
  }

  onVendorSelect(): void {
    const vendorId = this.royaltyForm.get('vendorID')?.value;
    const existingRoyalty = this.royalties.find(r => r.vendorID === vendorId);
  
    if (existingRoyalty) {
      this.isEditMode = true;
      this.editingRoyaltyID = existingRoyalty.royaltyID;
      this.royaltyForm.patchValue({
        royaltyFee: existingRoyalty.royaltyFee
      });
    } else {
      this.isEditMode = false;
      this.editingRoyaltyID = null;
      // ❌ REMOVE the patchValue for royaltyFee
      // Let user type royaltyFee manually for new vendor
    }
  }
  
  saveRoyalty(): void {
    if (this.royaltyForm.invalid) {
      this.toastr.error('Please complete the form correctly.');
      return;
    }
  
    const formData = this.royaltyForm.value;
    const selectedVendor = this.vendors.find(v => Number(v.vendorID) === Number(formData.vendorID)); 
  
    if (!selectedVendor) {
      this.toastr.error('Selected vendor not found.');
      return;
    }
  
    const royaltyData: Royalty = {
      royaltyID: this.isEditMode && this.editingRoyaltyID ? this.editingRoyaltyID : 0,
      vendorID: formData.vendorID,
      royaltyFee: formData.royaltyFee,
      vendorName: selectedVendor.CompanyName   // ✅ Correct now
    };
  
    this.isLoading = true;
  
    if (this.isEditMode) {
      this.royaltyService.updateRoyalty(royaltyData).subscribe({
        next: () => {
          this.toastr.success('Royalty updated');
          this.loadRoyalties();
          this.resetForm();
          this.isLoading = false;
        },
        error: () => {
          this.toastr.error('Failed to update royalty');
          this.isLoading = false;
        }
      });
    } else {
      this.royaltyService.createRoyalty(royaltyData).subscribe({
        next: () => {
          this.toastr.success('Royalty created');
          this.loadRoyalties();
          this.resetForm();
          this.isLoading = false;
        },
        error: () => {
          this.toastr.error('Failed to create royalty');
          this.isLoading = false;
        }
      });
    }
  }
  
  
  editRoyalty(royalty: Royalty): void {
    this.isEditMode = true;
    this.editingRoyaltyID = royalty.royaltyID;
    this.royaltyForm.patchValue({
      vendorID: royalty.vendorID,
      royaltyFee: royalty.royaltyFee
    });
  }

  deleteRoyalty(id: number): void {
    if (confirm('Are you sure you want to delete this royalty?')) {
      this.isLoading = true;
      this.royaltyService.deleteRoyalty(id).subscribe({
        next: () => {
          this.toastr.success('Royalty deleted');
          this.loadRoyalties();
          this.isLoading = false;
        },
        error: () => {
          this.toastr.error('Failed to delete royalty');
          this.isLoading = false;
        }
      });
    }
  }

  resetForm(): void {
    this.royaltyForm.reset({ vendorID: null, royaltyFee: 0 });
    this.isEditMode = false;
    this.editingRoyaltyID = null;
  }

  getVendorName(vendorId: number): string {
    if (!this.vendors || this.vendors.length === 0) return 'Unknown';
    const match = this.vendors.find(v => Number(v.vendorID) === Number(vendorId));
    return match ? match.CompanyName : 'Unknown';
  }  
}
