import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Contract } from '../models/contract.model';
import { map, Observable } from 'rxjs';
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
  
  updateContractPayment(contractID: number, amount: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/update-payment/${contractID}`, { amount });
  }
}
