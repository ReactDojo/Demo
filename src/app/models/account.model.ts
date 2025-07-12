export interface Account {
  accountID?: number;
  customerID: number;
  startDate: string;
  endDate: string;
  monthlyBilling: number;
  royaltyFee: number;
  balance: number;
  supplierID: number;
  frequencyID?: number;
  contractID?: number;
  originalAmount?: number;
  daysOfWeek?: string;
  financedAmount?: number;
  productID?: number;
  numOfVisits?: number;
  downpayment?: number;
  customermonthlyamount?:number;
  initialPaymentsMade?: number;
  monthlyPayment?: number;
  runningTotal?: number;
}