export interface Contract {
  contractID?: number;
  accountID?: number;
  supplierID: number;
  customerID: number;
  productID: number;
  runningTotal?: number;
  financedAmount?: number;
  startDate: string;
  endDate: string;
  frequencyID: number;
  originalAmount: number;
  notes?: string;
  paymentOnProduct?:number;
  contractData?: string;
  daysOfWeek?: string;
  downpayment?: number;
  customermonthlyamount?:number;
  customerMonthlyAmount?:number;
  monthlyPayment?: number;
}
