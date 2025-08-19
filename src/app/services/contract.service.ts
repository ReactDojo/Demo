import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Contract } from '../models/contract.model';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Account } from '../models/account.model';


@Injectable({ providedIn: 'root' })
export class ContractService {
  private baseUrl = 'http://localhost/api/contracts';

  constructor(private http: HttpClient) {}

  getContracts(): Observable<Contract[]> {
    return this.http.get<Contract[]>(this.baseUrl);
  }

  createContract(data: Contract): Observable<any> {
    return this.http.post(this.baseUrl, data);
  }

  updateContract(id: number, data: Contract): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, data);
  }

  deleteContract(contractID: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${contractID}`);
  }

  softDeleteContract(contractID: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/soft-delete/${contractID}`, {});
  }
  
  getContractsBySupplier(supplierID: number): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.baseUrl}/by-supplier/${supplierID}`);
  }
  getContractsByVendor(vendorId: number | string): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.baseUrl}/by-vendor/${vendorId}`);
  }
  getTotalMonthlyPaymentBySupplier(supplierId: number): Observable<number> {
    return this.http.get<{ supplierId: number; totalMonthlyPayment: number }>(      `http://localhost/api/contracts/${supplierId}/total-payments`    ).pipe(
      map(res => res.totalMonthlyPayment)
    );
  }
  
  updateContractPayment(id: number, amount: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, { amount })
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: any) {
    console.error('An error occurred:', error);
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }
}
