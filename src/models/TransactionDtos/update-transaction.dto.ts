import { TransactionTypeEnum } from '../Enums/transaction-type.enum';
import { Money } from '../Money/money.dto';

export interface UpdateTransactionDto {
    Id: string,
    Name: string,
    Description?: string,
    Value: Money,
    TransactionType: TransactionTypeEnum,
    TransactionDate?: Date,
    TransactionGroupId?: string
}
