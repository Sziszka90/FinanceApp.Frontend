import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Subscription, take } from 'rxjs';
import { Router } from '@angular/router';
import { UserApiService } from '../../../services/user.api.service';
import { MatSelectModule } from '@angular/material/select';
import { LoaderComponent } from '../../shared/loader/loader.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CurrencyEnum } from 'src/models/Enums/currency.enum';

@Component({
  selector: 'registration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSelectModule,
    LoaderComponent,
    MatSnackBarModule
  ],
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss'],
})
export class RegistrationComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private apiService = inject(UserApiService)
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  registrationForm: FormGroup = this.fb.group({
    userName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [
        Validators.required,
        Validators.pattern('^(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$'),
        Validators.minLength(8),
      ],
    ],
    currency: ['', [Validators.required]],
  });

  loading = signal<boolean>(false);

  registrationSubscription: Subscription | undefined;

  currencyOptions = Object.keys(CurrencyEnum).filter((key) =>
    isNaN(Number(key))
  );

  onSubmit() {
    if (this.registrationForm.valid) {
      this.loading.set(true);
      this.registrationSubscription = this.apiService
        .register({
          userName: this.registrationForm.get('userName')?.value,
          email: this.registrationForm.get('email')?.value,
          password: this.registrationForm.get('password')?.value,
          baseCurrency: this.registrationForm.get('currency')?.value,
        })
        .pipe(take(1))
        .subscribe({
          next: () => {
            this.loading.set(false);
            this.snackBar.open('Registration successful! Confirm email address', 'Close', { duration: 5000, panelClass: 'info-snackbar' });
            this.router.navigate(['/login']);
          },
          error: () => {
            this.loading.set(false);
          }
        });
    } else {
      this.registrationForm.markAllAsTouched();
    }
  }

  ngOnDestroy(): void {
    this.registrationSubscription?.unsubscribe();
  }
}
