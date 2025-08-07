import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  // Custom validator for optional strong password
  private optionalStrongPassword(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    
    // Allow empty passwords (optional field)
    if (!value) {
      return null;
    }
    
    // If password is provided, it must be strong
    const errors: ValidationErrors = {};
    
    // Minimum 8 characters
    if (value.length < 8) {
      errors['minlength'] = { requiredLength: 8, actualLength: value.length };
    }
    
    // Must contain uppercase
    if (!/[A-Z]/.test(value)) {
      errors['pattern'] = { message: 'Must contain uppercase letter' };
    }
    
    // Must contain number  
    if (!/\d/.test(value)) {
      errors['pattern'] = { message: 'Must contain number' };
    }
    
    // Must contain special character
    if (!/[^A-Za-z0-9]/.test(value)) {
      errors['pattern'] = { message: 'Must contain special character' };
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
  }

  override formGroup: FormGroup<UserFormModel> = this.fb.group<UserFormModel>({
    userName: new FormControl('', [Validators.minLength(2)]),
    password: new FormControl('', [this.optionalStrongPassword.bind(this)]),
    currency: new FormControl(CurrencyEnum.EUR)
  });

  override customValidationMessages = {
    userName: {
      required: 'User name is required',
      minlength: 'Minimum 2 characters required'
    },
    password: {
      minlength: 'Password must be at least 8 characters long',
      pattern: 'Password must include uppercase letter, number, and special character'
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
      this.formGroup.patchValue({
        userName: user.userName,
        currency: user.baseCurrency
      });
    });
  }

  onSubmit(): void {
    if (this.isFormValid()) {
      const formValue = this.getFormValue();
      if (!formValue) {return;}

      this.executeWithLoading(
        this.userApiService.updateUser({
          id: this.user?.id,
          userName: this.getFieldValue('userName') || this.user?.userName,
          password: this.getFieldValue('password') || '',
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
    if (object1 == null || object2 == null) {
      return false;
    }
    return object1.id === object2.id;
  }
}
