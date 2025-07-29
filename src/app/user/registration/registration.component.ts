import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { take } from 'rxjs';
import { Router } from '@angular/router';
import { UserApiService } from '../../../services/user.api.service';
import { MatSelectModule } from '@angular/material/select';
import { LoaderComponent } from '../../shared/loader/loader.component';
import { CurrencyEnum } from 'src/models/Enums/currency.enum';
import { BaseComponent } from '../../shared/base-component';

@Component({
  selector: 'registration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSelectModule,
    LoaderComponent
  ],
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss']
})
export class RegistrationComponent extends BaseComponent {
  private fb = inject(FormBuilder);
  private apiService = inject(UserApiService);
  private router = inject(Router);

  override formGroup: FormGroup = this.fb.group({
    userName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern('^(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$')
      ]
    ],
    currency: ['', [Validators.required]]
  });

  override customValidationMessages = {
    userName: {
      required: 'User name is required',
      minlength: 'Minimum 2 characters required'
    },
    email: {
      required: 'Email is required',
      email: 'Invalid email format'
    },
    password: {
      required: 'Password is required',
      minlength: 'Minimum 8 characters required',
      pattern: 'Include uppercase letter, number, and special character'
    },
    currency: {
      required: 'Currency is required'
    }
  };

  currencyOptions = Object.keys(CurrencyEnum).filter((key) =>
    isNaN(Number(key))
  );

  onSubmit(): void {
    if (this.isFormValid()) {
      const formValue = this.getFormValue();
      if (!formValue) {return;}

      this.executeWithLoading(
        this.apiService.register({
          userName: this.getFieldValue('userName') || '',
          email: this.getFieldValue('email') || '',
          password: this.getFieldValue('password') || '',
          baseCurrency: this.getFieldValue('currency') || CurrencyEnum.EUR
        }).pipe(take(1)),
        'Registration successful! Confirm email address',
        'Registration failed'
      ).subscribe({
        next: () => {
          this.router.navigate(['/login']);
        }
      });
    } else {
      this.markAllFieldsAsTouched();
    }
  }
}
