// src/app/models/royalty.model.ts
export interface Royalty {
    royaltyID?: number;
    vendorID: number;
    royaltyFee: number;
    vendorName?: string; // optional if you're joining/displaying
  }