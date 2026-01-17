import { Money } from '../Money/money.dto';

export interface TopTransactionGroupDto {
  id: string;
  name: string;
  description?: string;
  groupIcon?: string;
  totalAmount: Money;
  transactionCount: number;
  percentage: number;
}
