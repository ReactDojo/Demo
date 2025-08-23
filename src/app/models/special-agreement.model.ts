export interface SpecialAgreement {
  Id?: number;
  SupplierId?: number | null;
  CustomerId?: number | null;
  StartDate?: string | null;       // "YYYY-MM-DD"
  EndDate?: string | null;         // "YYYY-MM-DD"
  RoyaltyPercent?: number | null;
  AgreementPrice?: number | null;  // server uses MONEY; treat as number in TS
  royaltyFee?: number | null;
  agreementSubtotal?: number | null;
}
