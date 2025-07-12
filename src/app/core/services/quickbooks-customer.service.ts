import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Customer } from '../../models/customer.model';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class QuickBooksCustomerService {
  private baseUrl = environment.quickbooks.baseUrl;
  private realmId = '9341452050405472';
  private minorVersion = environment.quickbooks.minorVersion;

  constructor(private http: HttpClient) {}

  getCustomers(): Observable<any> {
    const query = encodeURIComponent('SELECT * FROM Customer');
    return this.http.get(
      `${this.baseUrl}/${this.realmId}/query?query=${query}&minorversion=${this.minorVersion}`
    ).pipe(
      catchError(this.handleError)
    );
  }

  createCustomer(customer: Customer): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/${this.realmId}/customer?minorversion=${this.minorVersion}`,
      customer
    ).pipe(
      catchError(this.handleError)
    );
  }

  updateCustomer(customer: Customer): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/${this.realmId}/customer?minorversion=${this.minorVersion}`,
      customer
    ).pipe(
      catchError(this.handleError)
    );
  }

  deleteCustomer(id: string, syncToken: string): Observable<any> {
    const body = { Id: id, Active: false, SyncToken: syncToken };
    return this.http.post(
      `${this.baseUrl}/${this.realmId}/customer?operation=delete&minorversion=${this.minorVersion}`,
      body
    ).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any) {
    console.error('QuickBooks API Error:', error);
    return throwError(() => new Error('Something went wrong with QuickBooks API'));
  }
}
