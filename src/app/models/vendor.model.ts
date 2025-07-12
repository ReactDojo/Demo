export interface Vendor {
  Id: string;
  displayName: string;
  PrimaryEmailAddr?: { Address: string };
  PrimaryPhone?: { FreeFormNumber: string };
  CompanyName?: string;
  TaxIdentifier?: string;
  Active?: boolean;
  vendorID: number; 
}
export interface QuickBooksVendorResponse {
  QueryResponse: {
    Vendor: Vendor[];
  };
  time: string;
}