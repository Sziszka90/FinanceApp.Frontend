import { CurrencyEnum } from "../Enums/currency.enum";


export interface GetUserDto {
    id: string,
    userName: string,
    email: string,
    baseCurrency: CurrencyEnum
}
