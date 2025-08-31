import { CurrencyEnum } from '../Enums/currency.enum';

export interface UpdateUserDto {
    Id: string,
    UserName: string,
    Password?: string,
    BaseCurrency: CurrencyEnum
}
