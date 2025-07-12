import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Vendor } from '../../models/vendor.model';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class QuickBooksVendorService {
  private baseUrl = environment.quickbooks.baseUrl;
  private realmId = '9341452050405472';
  private minorVersion = environment.quickbooks.minorVersion;

  constructor(private http: HttpClient) {}

  getVendors(): Observable<any> {
    const query = encodeURIComponent('SELECT * FROM Vendor');
    return this.http.get(
      `${this.baseUrl}/${this.realmId}/query?query=${query}&minorversion=${this.minorVersion}`
    );
  }

  createVendor(vendor: Vendor): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/${this.realmId}/vendor?minorversion=${this.minorVersion}`,
      vendor
    );
  }

  updateVendor(vendor: Vendor): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/${this.realmId}/vendor?minorversion=${this.minorVersion}`,
      vendor
    );
  }

  deleteVendor(id: string, syncToken: string): Observable<any> {
    const body = { Id: id, Active: false, SyncToken: syncToken };
    return this.http.post(
      `${this.baseUrl}/${this.realmId}/vendor?operation=delete&minorversion=${this.minorVersion}`,
      body
    );
  }
}
