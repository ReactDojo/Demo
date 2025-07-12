import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Royalty } from '../models/royalty.model';

@Injectable({
  providedIn: 'root'
})
export class RoyaltyService {
  private baseUrl = 'http://localhost/api/royalties';

  constructor(private http: HttpClient) {}

  // ✅ Get all royalties (you wanted to keep this)
  getAll(): Observable<Royalty[]> {
    return this.http.get<Royalty[]>(this.baseUrl);
  }

  // ✅ Create royalty
  createRoyalty(royalty: Royalty): Observable<any> {
    console.log('📤 Creating royalty:', royalty); // Optional Debug
    return this.http.post(this.baseUrl, royalty);
  }

  // ✅ Update royalty
  updateRoyalty(royalty: Royalty): Observable<any> {
    return this.http.put(`${this.baseUrl}/${royalty.royaltyID}`, royalty);
  }

  // ✅ Delete royalty
  deleteRoyalty(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  // ✅ Get vendor by ID
  getVendorById(vendorId: number): Observable<any> {
    return this.http.get<any>(`http://localhost/api/vendors/${vendorId}`);
  }

  // ✅ Get royalty by vendor ID
  getRoyaltyByVendorId(vendorID: number): Observable<Royalty> {
    return this.http.get<Royalty>(`http://localhost/api/Royalty/vendor/${vendorID}`);
  }
}
