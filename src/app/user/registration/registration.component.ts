import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormField, FormRoot, email, form, minLength, pattern, required } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { UserApiService } from '../../../services/user.api.service';
import { MatSelectModule } from '@angular/material/select';
import { LoaderComponent } from '../../shared/loader/loader.component';
import { CurrencyEnum } from 'src/models/Enums/currency.enum';
import { BaseComponent } from '../../shared/base-component';

@Component({
  selector: 'registration',
  standalone: true,
  imports: [FormField, FormRoot, MatSelectModule, LoaderComponent],
  templateUrl: './registration.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./registration.component.scss']
})
export class RegistrationComponent extends BaseComponent {
  private apiService = inject(UserApiService);
  private router = inject(Router);

  readonly registrationModel = signal({
    userName: '',
    email: '',
    password: '',
    currency: null as CurrencyEnum | null
  });

  readonly registrationForm = form(this.registrationModel, path => {
    required(path.userName, { message: 'User name is required' });
    minLength(path.userName, 2, { message: 'Minimum 2 characters required' });
    required(path.email, { message: 'Email is required' });
    email(path.email, { message: 'Invalid email format' });
    required(path.password, { message: 'Password is required' });
    minLength(path.password, 8, { message: 'Minimum 8 characters required' });
    pattern(path.password, /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, {
      message: 'Include uppercase letter, number, and special character'
    });
    required(path.currency, { message: 'Currency is required' });
  }, {
    submission: {
      action: async () => {
        const model = this.registrationModel();
        this.setLoading(true);
        try {
          await firstValueFrom(this.apiService.register({
            userName: model.userName,
            email: model.email,
            password: model.password,
            baseCurrency: model.currency ?? CurrencyEnum.EUR
          }));
          this.setLoading(false);
          this.showSuccess('Registration successful! Please confirm email address.');
          await this.router.navigate(['/login']);
        } catch (error) {
          this.setLoading(false);
          this.handleError(error, 'Registration failed');
        }
      }
    }
  });

  currencyOptions = (Object.values(CurrencyEnum)
    .filter(value => typeof value === 'number' && value !== CurrencyEnum.XXX) as CurrencyEnum[]);
  readonly CurrencyEnum = CurrencyEnum;
}
