import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { UserFormModel } from 'src/models/Profile/user-form-model';
import { MatSelectModule } from '@angular/material/select';
import { UserApiService } from 'src/services/user.api.service';
import { GetUserDto } from 'src/models/UserDtos/get-user.dto';
import { CurrencyEnum } from 'src/models/Enums/currency.enum';
import { LoaderComponent } from '../../shared/loader/loader.component';
import { BaseComponent } from 'src/app/shared/base-component';

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
    isNaN(Number(key)) && key !== 'XXX'
  );

  ngOnInit(): void {
    this.userApiService.getActiveUser().subscribe({
      next: (user) => {
        this.user = user;
        this.formGroup.patchValue({
          userName: user.userName,
          currency: user.baseCurrency
        });
      },
      error: (error) => {
        this.handleError(error, 'Failed to load user profile');
      }
    });
  }

  onSubmit(): void {
    if (this.isFormValid()) {
      const formValue = this.getFormValue();
      if (!formValue) {return;}

      this.setLoading(true);

      this.userApiService.updateUser({
          id: this.user?.id,
          userName: this.getFieldValue('userName') || this.user?.userName,
          password: this.getFieldValue('password') || '',
          baseCurrency: this.getFieldValue('currency') ?? CurrencyEnum.EUR
        }).subscribe(() => {
          this.setLoading(false);
          this.router.navigate(['/']);
        },
        (error) => {
          this.setLoading(false);
          this.handleError(error, 'Failed to update profile');
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
