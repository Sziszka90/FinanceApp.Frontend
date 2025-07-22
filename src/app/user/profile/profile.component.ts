import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription, take } from 'rxjs';
import { Router } from '@angular/router';
import { UserFormModel } from 'src/models/Profile/user-form-model';
import { MatSelectModule } from '@angular/material/select';
import { AuthenticationService } from 'src/services/authentication.service';
import { UserApiService } from 'src/services/user.api.service';
import { GetUserDto } from 'src/models/UserDtos/get-user.dto';
import { CurrencyEnum } from 'src/models/Enums/currency.enum';

@Component({
  selector: 'profile',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSelectModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit, OnDestroy {
  private userApiService = inject(UserApiService);
  private authService = inject(AuthenticationService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  updateUserForm : FormGroup<UserFormModel> = this.fb.group<UserFormModel>({
    userName: new FormControl('', [Validators.required, Validators.minLength(2)]),
    password: new FormControl('', [
      Validators.pattern('^(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$'),
      Validators.minLength(8),
    ]),
    currency: new FormControl(CurrencyEnum.Unknown, [Validators.required]),
  });

  user!: GetUserDto;

  currencyOptions = Object.keys(CurrencyEnum).filter((key) =>
      isNaN(Number(key)));

  subscriptions: Subscription | undefined;

  ngOnInit(): void {
    this.userApiService.getActiveUser().pipe(take(1)).subscribe((user) => {
      this.user = user;
      this.updateUserForm.get('currency')?.setValue(user.baseCurrency);
    });
  }

  onSubmit() {
    if (this.updateUserForm.valid) {
      console.log('Form Data:', this.updateUserForm.value);
    } else {
      console.log('Form is invalid.');
    }
    const subscription = this.userApiService
    .updateUser({
      id: this.user?.id,
      userName: this.updateUserForm.get('userName')?.value ?? this.user?.userName,
      password: this.updateUserForm.get('password')?.value ?? "",
      baseCurrency: this.updateUserForm.get('currency')?.value ?? CurrencyEnum.Unknown,
    }).pipe(take(1))
    .subscribe(() => {
      this.authService.logout();
      this.router.navigate(['/'])
    }
    );

    this.subscriptions?.add(subscription);
  }

  ngOnDestroy(): void {
    this.subscriptions?.unsubscribe();
  }
}
