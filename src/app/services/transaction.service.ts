import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { MonthlyAccountTransaction } from '../models/monthly-account-transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private baseUrl = 'http://localhost/api/monthlytransactions';

  constructor(private http: HttpClient) {}

  getTransactions(): Observable<MonthlyAccountTransaction[]> {
    return this.http.get<MonthlyAccountTransaction[]>(this.baseUrl);
  }

  getTransactionsByVendor(vendorId: number): Observable<MonthlyAccountTransaction[]> {
    return this.http.get<MonthlyAccountTransaction[]>(`${this.baseUrl}/vendor/${vendorId}`);
  }

  createTransaction(tx: MonthlyAccountTransaction): Observable<any> {
    return this.http.post(this.baseUrl, tx);
  }

  updateTransaction(tx: MonthlyAccountTransaction): Observable<any> {
    return this.http.put(`${this.baseUrl}/${tx.transactionID}`, tx);
  }

  deleteTransaction(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
