export type MonthlyInsightCategory =
  | 'unusual_transaction'
  | 'additional_income'
  | 'spending_exceeds_income'
  | 'spending_change'
  | 'recurring_payment'
  | 'positive_pattern';

export type MonthlyInsightSeverity = 'info' | 'notice' | 'attention';

export interface MonthlyInsightsRequestDto {
  year: number;
  month: number;
  lookbackMonths?: number;
}

export interface MonthlyInsightCardDto {
  category: MonthlyInsightCategory;
  severity: MonthlyInsightSeverity;
  title: string;
  description: string;
  transactionIds: string[];
  amount?: number | null;
  currency?: string | null;
}

export interface MonthlyInsightsResponseDto {
  year: number;
  month: number;
  currency?: string | null;
  insights: MonthlyInsightCardDto[];
  isAiGenerated: true;
}
