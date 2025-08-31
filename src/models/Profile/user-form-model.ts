import { FormControl } from '@angular/forms';
import { CurrencyEnum } from '../Enums/currency.enum';

export interface UserFormModel {
  UserName: FormControl<string | null>;
  Password: FormControl<string | null>;
  Currency: FormControl<CurrencyEnum | null>;
}
