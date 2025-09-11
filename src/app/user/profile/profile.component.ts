import { Component, inject, OnInit } from '@angular/core';

import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
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
    ReactiveFormsModule,
    MatSelectModule,
    LoaderComponent
],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent extends BaseComponent implements OnInit {
  private userApiService = inject(UserApiService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  private optionalStrongPassword(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    if (!value) {
      return null;
    }
    
    const errors: ValidationErrors = {};
    
    if (value.length < 8) {
      errors['minlength'] = { requiredLength: 8, actualLength: value.length };
    }
    
    if (!/[A-Z]/.test(value)) {
      errors['pattern'] = { message: 'Must contain uppercase letter' };
    }
    
    if (!/\d/.test(value)) {
      errors['pattern'] = { message: 'Must contain number' };
    }
    
    if (!/[^A-Za-z0-9]/.test(value)) {
      errors['pattern'] = { message: 'Must contain special character' };
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
  }

  override formGroup: FormGroup<UserFormModel> = this.fb.group<UserFormModel>({
    UserName: new FormControl('', [Validators.minLength(2)]),
    Password: new FormControl('', [this.optionalStrongPassword.bind(this)]),
    Currency: new FormControl(CurrencyEnum.EUR)
  });

  override customValidationMessages = {
    UserName: {
      required: 'User name is required',
      minlength: 'Minimum 2 characters required'
    },
    Password: {
      minlength: 'Password must be at least 8 characters long',
      pattern: 'Password must include uppercase letter, number, and special character'
    },
    Currency: {
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
      this.formGroup.patchValue({
        UserName: user.UserName,
        Currency: user.BaseCurrency
      });
    });
  }

  onSubmit(): void {
    if (this.isFormValid()) {
      const formValue = this.getFormValue();
      if (!formValue) {return;}

      this.executeWithLoading(
        this.userApiService.updateUser({
          Id: this.user?.Id,
          UserName: this.getFieldValue('UserName') || this.user?.UserName,
          Password: this.getFieldValue('Password') || '',
          BaseCurrency: this.getFieldValue('Currency') ?? CurrencyEnum.EUR
        }).pipe(take(1)),
        'Profile updated successfully',
        'Failed to update profile'
      ).subscribe(() => {
        this.router.navigate(['/']);
      });
    } else {
      this.markAllFieldsAsTouched();
    }
  }

  compareCategoryObjects(object1: CurrencyEnum, object2: CurrencyEnum) {
    if (object1 == null || object2 == null) {
      return false;
    }

    return object1 === object2;
  }
}
