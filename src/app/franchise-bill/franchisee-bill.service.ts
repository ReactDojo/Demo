import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { FranchiseeBill } from './franchisee-bill.model';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class FranchiseeBillService {
  private baseUrl = environment.quickbooks.baseUrl;
  private companyId = environment.quickbooks.realmId;
  private minorVersion = environment.quickbooks.minorVersion;

  constructor(private http: HttpClient) {}

  getBills(): Observable<any[]> {
    const query = 'Select * from Bill';
    return this.http.post(
      `${this.baseUrl}/v3/company/${this.companyId}/query?minorversion=${this.minorVersion}`,
      query,
      { headers: { 'Content-Type': 'application/text' } }
    ).pipe(
      map((res: any) => res.QueryResponse?.Bill || []),
      catchError(err => {
        console.error('Failed to fetch bills:', err);
        return of([]); // prevent crash
      })
    );
  }

  getBillById(id: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/v3/company/${this.companyId}/bill/${id}?minorversion=${this.minorVersion}`
    ).pipe(catchError(this.handleError));
  }

  createBill(data: any): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/v3/company/${this.companyId}/bill?minorversion=${this.minorVersion}`,
      data
    ).pipe(catchError(this.handleError));
  }

  updateBill(data: any): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/v3/company/${this.companyId}/bill?minorversion=${this.minorVersion}`,
      data
    ).pipe(catchError(this.handleError));
  }

  deleteBill(id: string, syncToken: string): Observable<any> {
    const body = { Id: id, SyncToken: syncToken };
    return this.http.post(
      `${this.baseUrl}/v3/company/${this.companyId}/bill?operation=delete`,
      body
    ).pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    console.error('Franchisee Bill API Error:', error);
    return throwError(() => new Error('Something went wrong with Franchisee Bill API'));
  }
}