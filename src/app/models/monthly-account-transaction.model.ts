export interface MonthlyAccountTransaction {
  transactionID: number;

  accountID: number;
  customerID: number;
  frequencyID: number;

  startDate: string;       // ISO 8601 string
  endDate?: string | null; // nullable

  monthlyBilling?: number | null;
  supplierID: number;
  contractID: number;

  originalAmount?: number | null;
  daysOfWeek?: string | null;

  financedAmount?: number | null;
  productID?: number | null;
  numOfVisits: number;

  royaltyFee?: number | null;
  monthlyPayment?: number | null;
  runningTotal?: number | null;

  periodEndDate: string;   // ISO 8601 string
  createdAt: string;       // ISO 8601 string
}
