import { TransactionTypeEnum } from '../Enums/transaction-type.enum';
import { Money } from '../Money/money.dto';

export interface CreateTransactionDto {
    Name: string,
    Description: string,
    Value: Money,
    TransactionDate: Date,
    TransactionType: TransactionTypeEnum,
    TransactionGroupId?: string
}
