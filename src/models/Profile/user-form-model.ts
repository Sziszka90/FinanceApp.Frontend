import { FormControl } from "@angular/forms";
import { CurrencyEnum } from "../Enums/currency.enum";

export interface UserFormModel {
  userName: FormControl<string | null>;
  password: FormControl<string | null>;
  currency: FormControl<CurrencyEnum | null>;
}
