import { AbstractControl, ValidationErrors } from "@angular/forms";
import { CurrencyEnum } from "src/models/Enums/currency.enum";

export function enumValidator(enumObj: any) {
  return (control: AbstractControl): ValidationErrors | null => {
    const value =
      control.value && typeof control.value === "object" && "value" in control.value
        ? control.value.value
        : control.value;
    const isValid = Object.values(enumObj).includes(value);
    return isValid ? null : { invalidEnum: true };
  };
}

export function getCurrencyName(currency: number): string {
  return CurrencyEnum[currency];
}
