import { TransactionTypeEnum } from "../Enums/transaction-type.enum";
import { Money } from "../Money/money.dto";

export interface UpdateTransactionDto {
    id: string,
    name: string,
    description?: string,
    value: Money,
    transactionType: TransactionTypeEnum,
    transactionDate?: Date,
    transactionGroupId?: string
}
