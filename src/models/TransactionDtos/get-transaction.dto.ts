import { TransactionTypeEnum } from '../Enums/transaction-type.enum';
import { Money } from '../Money/money.dto';
import { GetTransactionGroupDto } from '../TransactionGroupDtos/get-transaction-group.dto';

export interface GetTransactionDto {
    Id: string;
    Name: string;
    Description?: string;
    Value: Money;
    TransactionDate: Date;
    TransactionType: TransactionTypeEnum;
    TransactionGroup?: GetTransactionGroupDto;
}
