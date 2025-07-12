import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Frequency } from '../models/frequency.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FrequencyService {
  private baseUrl = 'http://localhost/api/frequencies';

  constructor(private http: HttpClient) {}

  getFrequencies(): Observable<Frequency[]> {
    return this.http.get<Frequency[]>(this.baseUrl);
  }
}
