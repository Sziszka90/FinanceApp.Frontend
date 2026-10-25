export interface CategorizationRuleDto {
  id: string;
  merchantText: string;
  transactionGroupId: string;
  transactionGroupName: string;
}

export interface SaveCategorizationRuleDto {
  merchantText: string;
  transactionGroupId: string;
}
