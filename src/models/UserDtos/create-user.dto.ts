import { CurrencyEnum } from "../Enums/currency.enum";


export interface CreateUserDto {
    userName: string,
    email: string,
    password: string,
    baseCurrency: CurrencyEnum
}
