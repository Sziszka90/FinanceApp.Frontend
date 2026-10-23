import { TransactionTypeEnum } from '../Enums/transaction-type.enum';
import { GetTransactionDto } from './get-transaction.dto';

export interface TransactionCursorPageDto {
  items: GetTransactionDto[];
  nextCursor: string | null;
}

export interface TransactionPageFilter {
  transactionName?: string;
  transactionDate?: string;
  transactionType?: TransactionTypeEnum;
}
