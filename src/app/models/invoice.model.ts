export interface Invoice {
  Id?: string;
  CustomerRef: { value: string };
  Line: Array<{
    Amount: number;
    DetailType: 'SalesItemLineDetail';
    SalesItemLineDetail: {
      ItemRef: { value: string; name: string };
    };
  }>;
  TxnDate?: string;
  DueDate?: string;
}
