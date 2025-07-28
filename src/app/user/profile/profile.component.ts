import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { take } from 'rxjs';
import { Router } from '@angular/router';
import { UserFormModel } from 'src/models/Profile/user-form-model';
import { MatSelectModule } from '@angular/material/select';
import { AuthenticationService } from 'src/services/authentication.service';
import { UserApiService } from 'src/services/user.api.service';
import { GetUserDto } from 'src/models/UserDtos/get-user.dto';
import { CurrencyEnum } from 'src/models/Enums/currency.enum';
import { BaseComponent } from '../../shared/base-component';
import { LoaderComponent } from '../../shared/loader/loader.component';

@Component({
  selector: 'profile',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSelectModule,
    LoaderComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent extends BaseComponent implements OnInit {
  private userApiService = inject(UserApiService);
  private authService = inject(AuthenticationService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  override formGroup: FormGroup<UserFormModel> = this.fb.group<UserFormModel>({
    userName: new FormControl('', [Validators.minLength(2)]),
    password: new FormControl('', [
      Validators.pattern('^(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$'),
      Validators.minLength(8)
    ]),
    currency: new FormControl(CurrencyEnum.EUR)
  });

  override customValidationMessages = {
    userName: {
      required: 'User name is required',
      minlength: 'Minimum 2 characters required'
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

  user!: GetUserDto;

  currencyOptions = Object.keys(CurrencyEnum).filter((key) =>
    isNaN(Number(key)));

  ngOnInit(): void {
    this.executeWithLoading(
      this.userApiService.getActiveUser().pipe(take(1)),
      undefined,
      'Failed to load user profile'
    ).subscribe((user) => {
      this.user = user;
      this.setFieldValue('currency', user.baseCurrency);
    });
  }

  onSubmit(): void {
    if (this.isFormValid()) {
      const formValue = this.getFormValue();
      if (!formValue) {return;}

      this.executeWithLoading(
        this.userApiService.updateUser({
          id: this.user?.id,
          userName: this.getFieldValue('userName') ?? this.user?.userName,
          password: this.getFieldValue('password') ?? '',
          baseCurrency: this.getFieldValue('currency') ?? CurrencyEnum.EUR
        }).pipe(take(1)),
        'Profile updated successfully',
        'Failed to update profile'
      ).subscribe(() => {
        this.authService.logout();
        this.router.navigate(['/']);
      });
    } else {
      this.markAllFieldsAsTouched();
    }
  }

  compareCategoryObjects(object1: any, object2: any) {
    return object1 && object2 && object1.id == object2.id;
  }
}
