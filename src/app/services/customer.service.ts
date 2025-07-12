import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Customer,QuickBooksCustomerResponse  } from '../customer/customer.model';
import { map, Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})

export class CustomerService {
  private apiUrl = 'http://localhost/api/customers';

  constructor(private http: HttpClient) {}

  getCustomers(): Observable<Customer[]> {
    return this.http.get<QuickBooksCustomerResponse>(this.apiUrl).pipe(
      map(response => {
        const rawCustomers = response.QueryResponse?.Customer ?? [];
        console.log('Total customers:', rawCustomers.length); // 🔥 log count here
        return rawCustomers.map(c => ({
          ...c,
          customerID: c.Id // map 'Id' from QuickBooks to 'customerID' for dropdown binding
        }));
      })
    );
  }
  

  getCustomer(id: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.apiUrl}/${id}`);
  }

  createCustomer(customer: Customer): Observable<any> {
    return this.http.post(this.apiUrl, customer);
  }

  updateCustomer(id: string, customer: Customer): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, customer);
  }
}
