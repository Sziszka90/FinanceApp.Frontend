import { TransactionTypeEnum } from "../Enums/transaction-type.enum";
import { Money } from "../Money/money.dto";
import { GetTransactionGroupDto } from "../TransactionGroupDtos/get-transaction-group.dto";

export interface GetTransactionDto {
    id: string;
    name: string;
    description?: string;
    value: Money;
    transactionDate: Date;
    transactionType: TransactionTypeEnum;
    transactionGroup?: GetTransactionGroupDto;
}
