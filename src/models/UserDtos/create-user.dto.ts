import { CurrencyEnum } from '../Enums/currency.enum';


export interface CreateUserDto {
    UserName: string,
    Email: string,
    Password: string,
    BaseCurrency: CurrencyEnum
}
