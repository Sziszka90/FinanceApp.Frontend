import { CurrencyEnum } from "../Enums/currency.enum";

export interface UpdateUserDto {
    id: string,
    userName: string,
    password?: string,
    baseCurrency: CurrencyEnum
}
