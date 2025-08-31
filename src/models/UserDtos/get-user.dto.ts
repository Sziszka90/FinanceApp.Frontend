import { CurrencyEnum } from '../Enums/currency.enum';


export interface GetUserDto {
    Id: string,
    UserName: string,
    Email: string,
    BaseCurrency: CurrencyEnum
}
