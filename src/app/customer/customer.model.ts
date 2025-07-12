export interface Customer {
    Id: any;
    customerID?: number;
    syncToken?: string;
    displayName: string;
    DisplayName: string;
    title?: string;
    givenName?: string;
    middleName?: string;
    familyName?: string;
    suffix?: string;
    companyName?: string;
    primaryEmailAddr?: string;
    primaryPhone?: string;
    alternatePhone?: string;
    mobile?: string;
    fax?: string;
    printOnCheckName?: string;
    notes?: string;
    webAddr?: string;
    gstin?: string;
    businessNumber?: string;
    taxIdentifier?: string;
    royaltyFee?: number;
    parentRef?: number;
    job?: boolean;
    billWithParent?: boolean;
    currencyRef?: string;
    taxable?: boolean;
    balance?: number;
    balanceWithJobs?: number;
    openBalanceDate?: string;
    preferredDeliveryMethod?: string;
    active?: boolean;
  }
  export interface QuickBooksCustomerResponse {
    QueryResponse: {
      Customer: Customer[];
    };
    time: string;
  }