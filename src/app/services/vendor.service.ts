import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Vendor, QuickBooksVendorResponse} from '../models/vendor.model';
import { map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VendorService {
  private baseUrl = 'http://localhost/api/vendors';

  constructor(private http: HttpClient) {}

// vendor.service.ts
getVendors(): Observable<Vendor[]> {
  return this.http.get<QuickBooksVendorResponse>(this.baseUrl).pipe(
    map(response => {
      const rawVendors = response.QueryResponse?.Vendor ?? [];
      console.log(rawVendors[0])
      console.log(rawVendors[0].Id)
      return rawVendors.map(v => ({
        ...v,
        vendorID: Number(v.Id), // map QuickBooks 'Id' to 'vendorID' for form binding
      }));
    })
  );
}

  createVendor(data: Vendor): Observable<any> {
    return this.http.post(this.baseUrl, data);
  }

  updateVendor(id: number, data: Vendor): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, data);
  }

  getVendor(id: number): Observable<Vendor> {
    return this.http.get<Vendor>(`${this.baseUrl}/${id}`);
  }
  getVendorById(vendorId: number): Observable<any> {
    return this.http.get<any>(`http://localhost/api/vendors/${vendorId}`);
  }
}
