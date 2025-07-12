// // royalty.service.ts
// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { Royalty } from '../models/royalty.model';

// @Injectable({
//   providedIn: 'root'
// })
// export class RoyaltyService {
//   private baseUrl = 'http://localhost/api/royalties';

//   constructor(private http: HttpClient) {}

//   getAll(): Observable<Royalty[]> {
//     return this.http.get<Royalty[]>(this.baseUrl);
//   }

//   createRoyalty(royalty: Royalty): Observable<any> {
//     console.log('📤 Creating royalty:', royalty); // Optional Debug
//     return this.http.post(this.baseUrl, royalty);
//   }

//   updateRoyalty(royalty: Royalty): Observable<any> {
//     return this.http.put(`${this.baseUrl}/${royalty.royaltyID}`, royalty);
//   }

//   deleteRoyalty(id: number): Observable<any> {
//     return this.http.delete(`${this.baseUrl}/${id}`);
//   }
// }
