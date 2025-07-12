export interface Customer {
  customerID?: string; // was number — change to string
  id?: string;          // map the original QuickBooks "Id" field (optional if you're just using customerID)
  displayName: string;
  PrimaryEmailAddr?: { Address: string };
  PrimaryPhone?: { FreeFormNumber: string };
  CompanyName?: string;
  Active?: boolean;
}
