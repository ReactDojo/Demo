export interface FranchiseeBillLineItem {
  id?: string;
  description: string;
  amount: number;
  categoryAccountRef: string;
  taxCode?: string;
  classRef?: string;
}

export interface FranchiseeBill {
  id?: string;
  billNo: string;
  billDate: string;
  dueDate: string;
  vendorRef: string;
  terms?: string;
  memo?: string;
  lineItems: FranchiseeBillLineItem[];
  total?: number;
  gst?: number;
}