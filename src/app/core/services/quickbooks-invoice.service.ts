import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Invoice } from '../../models/invoice.model';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class QuickBooksInvoiceService {
  private baseUrl = environment.quickbooks.baseUrl;
  private realmId = '9341452050405472';
  private minorVersion = environment.quickbooks.minorVersion;

  constructor(private http: HttpClient) {}

  getInvoices(): Observable<any> {
    const query = encodeURIComponent('SELECT * FROM Invoice');
    return this.http.get(
      `${this.baseUrl}/${this.realmId}/query?query=${query}&minorversion=${this.minorVersion}`
    ).pipe(
      catchError(this.handleError)
    );
  }

  createInvoice(invoice: Invoice): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/${this.realmId}/invoice?minorversion=${this.minorVersion}`,
      invoice
    ).pipe(
      catchError(this.handleError)
    );
  }

  updateInvoice(invoice: Invoice): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/${this.realmId}/invoice?minorversion=${this.minorVersion}`,
      invoice
    ).pipe(
      catchError(this.handleError)
    );
  }

  deleteInvoice(id: string, syncToken: string): Observable<any> {
    const body = { Id: id, SyncToken: syncToken, status: 'Deleted' };
    return this.http.post(
      `${this.baseUrl}/${this.realmId}/invoice?operation=delete&minorversion=${this.minorVersion}`,
      body
    ).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any) {
    console.error('QuickBooks Invoice API Error:', error);
    return throwError(() => new Error('Something went wrong with the Invoice API'));
  }
}
