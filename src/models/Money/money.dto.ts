import { CurrencyEnum } from "../Enums/currency.enum";

export interface Money {
    amount: number,
    currency: CurrencyEnum
}
