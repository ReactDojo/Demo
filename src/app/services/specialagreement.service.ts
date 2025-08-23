import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SpecialAgreement } from '../models/special-agreement.model';

@Injectable({ providedIn: 'root' })
export class SpecialAgreementService {
  private baseUrl = 'http://localhost/api/special-agreements';

  constructor(private http: HttpClient) {}

  getAll(): Observable<SpecialAgreement[]> {
    return this.http.get<SpecialAgreement[]>(this.baseUrl)
      .pipe(catchError(this.handleError));
  }

  get(id: number): Observable<SpecialAgreement> {
    return this.http.get<SpecialAgreement>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  create(payload: SpecialAgreement): Observable<SpecialAgreement> {
    return this.http.post<SpecialAgreement>(this.baseUrl, payload)
      .pipe(catchError(this.handleError));
  }

  update(id: number, payload: SpecialAgreement): Observable<SpecialAgreement> {
    return this.http.put<SpecialAgreement>(`${this.baseUrl}/${id}`, payload)
      .pipe(catchError(this.handleError));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  getBySupplier(supplierId: number): Observable<SpecialAgreement[]> {
    return this.http.get<SpecialAgreement[]>(`${this.baseUrl}/by-supplier/${supplierId}`)
      .pipe(catchError(this.handleError));
  }

  getByCustomer(customerId: number): Observable<SpecialAgreement[]> {
    return this.http.get<SpecialAgreement[]>(`${this.baseUrl}/by-customer/${customerId}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    console.error('[SpecialAgreementService] Error:', error);
    return throwError(() => new Error('Request failed; please try again.'));
  }
}
