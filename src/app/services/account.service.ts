import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Account } from '../models/account.model';
import { catchError, Observable, tap, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private baseUrl = 'http://localhost/api/accounts';

  constructor(private http: HttpClient) {}

  getAccounts(): Observable<Account[]> {
    return this.http.get<Account[]>(this.baseUrl);
  }

  createAccount(data: Account): Observable<any> {
    return this.http.post(this.baseUrl, data);
  }
  
  updateAccount(account: Account): Observable<any> {
    console.log('🛠️ Attempting to update account:', account);
  
    if (!account || !account.accountID) {
      console.error('❌ Invalid account object provided:', account);
      return throwError(() => new Error('Invalid account data'));
    }
  
    const url = this.baseUrl + `/${account.accountID}`;
    console.log(`🌐 Sending PUT request to: ${url}`);
  
    return this.http.put(url, account).pipe(
      tap(response => {
        console.log('✅ Account update response:', response);
      }),
      catchError(error => {
        console.error('❌ Account update failed:', error);
        return throwError(() => error);
      })
    );
  }
  

  deleteAccount(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
  getAccountsByVendor(vendorId: number | string): Observable<Account[]> {
    return this.http.get<Account[]>(`${this.baseUrl}/vendor/${vendorId}`);
  }

  getAccountByContractId(contractId: number): Observable<Account> {
    return this.http.get<Account>(`${this.baseUrl}/by-contract/${contractId}`);
  }
}
