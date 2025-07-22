import { TransactionTypeEnum } from "../Enums/transaction-type.enum";
import { Money } from "../Money/money.dto";

export interface CreateTransactionDto {
    name: string,
    description: string,
    value: Money,
    transactionDate: Date,
    transactionType: TransactionTypeEnum,
    transactionGroupId?: string
}
