import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { ProfileComponent } from './profile.component';
import { AuthenticationService } from '../../../services/authentication.service';
import { UserApiService } from '../../../services/user.api.service';
import { ComponentErrorService } from '../../../services/component-error.service';
import { FormValidationService } from '../../../services/form-validation.service';
import { GetUserDto } from '../../../models/UserDtos/get-user.dto';
import { CurrencyEnum } from '../../../models/Enums/currency.enum';
import { BaseComponent } from '../../shared/base-component';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let userApiService: jasmine.SpyObj<UserApiService>;
  let authService: jasmine.SpyObj<AuthenticationService>;
  let router: jasmine.SpyObj<Router>;

  const mockUser: GetUserDto = {
    Id: '123',
    UserName: 'testuser',
    Email: 'test@example.com',
    BaseCurrency: CurrencyEnum.EUR
  };

  beforeEach(async () => {
    const userApiSpy = jasmine.createSpyObj('UserApiService', ['getActiveUser', 'updateUser']);
    const authSpy = jasmine.createSpyObj('AuthenticationService', ['logout']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const errorServiceSpy = jasmine.createSpyObj('ComponentErrorService', ['showError', 'showSuccess', 'clearError', 'getErrorMessage', 'handleError'], {
      hasError: jasmine.createSpy().and.returnValue(false),
      errorMessage: jasmine.createSpy().and.returnValue('')
    });
    const formValidationSpy = jasmine.createSpyObj('FormValidationService', [
      'hasFieldError', 
      'getFieldErrorMessage', 
      'validateForm', 
      'markAllFieldsAsTouched',
      'getAllFormErrors'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        ProfileComponent,
        ReactiveFormsModule,
        MatSelectModule,
        MatSnackBarModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: UserApiService, useValue: userApiSpy },
        { provide: AuthenticationService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ComponentErrorService, useValue: errorServiceSpy },
        { provide: FormValidationService, useValue: formValidationSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    userApiService = TestBed.inject(UserApiService) as jasmine.SpyObj<UserApiService>;
    authService = TestBed.inject(AuthenticationService) as jasmine.SpyObj<AuthenticationService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Setup default spy returns
    userApiService.getActiveUser.and.returnValue(of(mockUser));
    userApiService.updateUser.and.returnValue(of(mockUser));
  });

  afterEach(() => {
    // Clean up any pending timers and subscriptions
    if (fixture) {
      fixture.destroy();
    }
    // Clear any pending async operations
    if (typeof window !== 'undefined') {
      // Clear any pending timeouts/intervals that might have been set
      for (let i = 1; i < 99999; i++) {
        window.clearTimeout(i);
        window.clearInterval(i);
      }
    }
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should extend BaseComponent', () => {
      expect(component instanceof BaseComponent).toBe(true);
    });

    it('should initialize form group with correct structure', () => {
      expect(component.formGroup).toBeDefined();
      expect(component.formGroup.get('UserName')).toBeInstanceOf(FormControl);
      expect(component.formGroup.get('Password')).toBeInstanceOf(FormControl);
      expect(component.formGroup.get('Currency')).toBeInstanceOf(FormControl);
    });

    it('should set default currency to EUR', () => {
      expect(component.formGroup.get('Currency')?.value).toBe(CurrencyEnum.EUR);
    });

    it('should have correct validation messages', () => {
      expect(component.customValidationMessages).toEqual({
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
      });
    });

    it('should generate currency options from enum', () => {
      const expectedOptions = Object.keys(CurrencyEnum).filter((key) => isNaN(Number(key)));
      expect(component.currencyOptions).toEqual(expectedOptions);
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    describe('Username Validation', () => {
      it('should be invalid when username is too short', () => {
        const userNameControl = component.formGroup.get('UserName')!;
        userNameControl.setValue('a');
        userNameControl.markAsTouched();

        expect(userNameControl.invalid).toBe(true);
        expect(userNameControl.hasError('minlength')).toBe(true);
      });

      it('should be valid when username meets minimum length', () => {
        const userNameControl = component.formGroup.get('UserName')!;
        userNameControl.setValue('ab');

        expect(userNameControl.valid).toBe(true);
      });
    });

    describe('Password Validation (Optional Strong Password)', () => {
      it('should be valid when password is empty (optional)', () => {
        const passwordControl = component.formGroup.get('Password')!;
        passwordControl.setValue('');

        expect(passwordControl.valid).toBe(true);
      });

      it('should be invalid when password is too short', () => {
        const passwordControl = component.formGroup.get('Password')!;
        passwordControl.setValue('short');

        expect(passwordControl.invalid).toBe(true);
        expect(passwordControl.hasError('minlength')).toBe(true);
      });

      it('should be invalid when password lacks uppercase', () => {
        const passwordControl = component.formGroup.get('Password')!;
        passwordControl.setValue('lowercase123!');

        expect(passwordControl.invalid).toBe(true);
        expect(passwordControl.hasError('pattern')).toBe(true);
      });

      it('should be invalid when password lacks numbers', () => {
        const passwordControl = component.formGroup.get('Password')!;
        passwordControl.setValue('Uppercase!');

        expect(passwordControl.invalid).toBe(true);
        expect(passwordControl.hasError('pattern')).toBe(true);
      });

      it('should be invalid when password lacks special characters', () => {
        const passwordControl = component.formGroup.get('Password')!;
        passwordControl.setValue('Uppercase123');

        expect(passwordControl.invalid).toBe(true);
        expect(passwordControl.hasError('pattern')).toBe(true);
      });

      it('should be valid when password meets all requirements', () => {
        const passwordControl = component.formGroup.get('Password')!;
        passwordControl.setValue('ValidPass123!');

        expect(passwordControl.valid).toBe(true);
      });
    });
  });

  describe('Data Loading', () => {
    it('should load user data on initialization', () => {
      fixture.detectChanges();

      expect(userApiService.getActiveUser).toHaveBeenCalled();
      expect(component.user).toEqual(mockUser);
    });

    it('should populate form with user data', () => {
      fixture.detectChanges();

      expect(component.formGroup.get('UserName')?.value).toBe(mockUser.UserName);
      expect(component.formGroup.get('Currency')?.value).toBe(mockUser.BaseCurrency);
    });

    it('should handle API error when loading user data', () => {
      userApiService.getActiveUser.and.returnValue(throwError('API Error'));
      spyOn(console, 'error');

      fixture.detectChanges();

      expect(userApiService.getActiveUser).toHaveBeenCalled();
      // Component should handle error gracefully without crashing
      expect(component).toBeTruthy();
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not submit when form is invalid', () => {
      // Make form invalid
      component.formGroup.get('UserName')?.setValue('a'); // Too short

      component.onSubmit();

      expect(userApiService.updateUser).not.toHaveBeenCalled();
    });

    it('should submit valid form data', () => {
      // Set valid form data
      component.formGroup.get('UserName')?.setValue('newusername');
      component.formGroup.get('Password')?.setValue('NewPass123!');
      component.formGroup.get('Currency')?.setValue(CurrencyEnum.USD);

      component.onSubmit();

      expect(userApiService.updateUser).toHaveBeenCalledWith({
        Id: mockUser.Id,
        UserName: 'newusername',
        Password: 'NewPass123!',
        BaseCurrency: CurrencyEnum.USD
      });
    });

    it('should use existing username when form field is empty', () => {
      component.formGroup.get('UserName')?.setValue('');
      component.formGroup.get('Password')?.setValue('');
      component.formGroup.get('Currency')?.setValue(CurrencyEnum.USD);

      component.onSubmit();

      expect(userApiService.updateUser).toHaveBeenCalledWith({
        Id: mockUser.Id,
        UserName: mockUser.UserName,
        Password: '',
        BaseCurrency: CurrencyEnum.USD
      });
    });

    it('should use default currency when form field is empty', () => {
      component.formGroup.get('UserName')?.setValue('newusername');
      component.formGroup.get('Password')?.setValue('');
      component.formGroup.get('Currency')?.setValue(null);

      // Override the form's valid property to return true
      Object.defineProperty(component.formGroup, 'valid', {
        get: () => true
      });

      component.onSubmit();

      expect(userApiService.updateUser).toHaveBeenCalledWith({
        Id: mockUser.Id,
        UserName: 'newusername',
        Password: '',
        BaseCurrency: CurrencyEnum.EUR
      });
    });

    it('should logout and navigate after successful update', () => {
      component.formGroup.get('UserName')?.setValue('newusername');

      component.onSubmit();

      expect(authService.logout).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should handle API error on update', () => {
      userApiService.updateUser.and.returnValue(throwError(() => new Error('Update Error')));
      spyOn(console, 'error');

      component.formGroup.get('UserName')?.setValue('newusername');
      component.onSubmit();

      expect(userApiService.updateUser).toHaveBeenCalled();
      // Should handle error without crashing
      expect(component).toBeTruthy();
    });
  });

  describe('Password Validator', () => {
    it('should validate empty password as valid (optional)', () => {
      const passwordControl = new FormControl('');
      const validator = (component as any).optionalStrongPassword;
      
      const result = validator(passwordControl);
      expect(result).toBeNull();
    });

    it('should validate null password as valid (optional)', () => {
      const passwordControl = new FormControl(null);
      const validator = (component as any).optionalStrongPassword;
      
      const result = validator(passwordControl);
      expect(result).toBeNull();
    });

    it('should return validation errors for weak password', () => {
      const passwordControl = new FormControl('weak');
      const validator = (component as any).optionalStrongPassword;
      
      const result = validator(passwordControl);
      expect(result).toBeTruthy();
      expect(result['minlength']).toBeDefined();
      expect(result['pattern']).toBeDefined();
    });

    it('should validate strong password correctly', () => {
      const passwordControl = new FormControl('StrongPass123!');
      const validator = (component as any).optionalStrongPassword;
      
      const result = validator(passwordControl);
      expect(result).toBeNull();
    });
  });

  describe('Integration Tests', () => {
    it('should complete full user update workflow', () => {
      // Initial load
      fixture.detectChanges();
      expect(component.user).toEqual(mockUser);

      // Update form
      component.formGroup.get('UserName')?.setValue('updateduser');
      component.formGroup.get('Password')?.setValue('NewPassword123!');
      component.formGroup.get('Currency')?.setValue(CurrencyEnum.USD);

      // Submit form
      component.onSubmit();

      // Verify API call
      expect(userApiService.updateUser).toHaveBeenCalledWith({
        Id: mockUser.Id,
        UserName: 'updateduser',
        Password: 'NewPassword123!',
        BaseCurrency: CurrencyEnum.USD
      });

      // Verify logout and navigation
      expect(authService.logout).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should handle partial form updates correctly', () => {
      fixture.detectChanges();

      // Only update currency, leave username and password empty
      component.formGroup.get('UserName')?.setValue('');
      component.formGroup.get('Password')?.setValue('');
      component.formGroup.get('Currency')?.setValue(CurrencyEnum.GBP);

      component.onSubmit();

      expect(userApiService.updateUser).toHaveBeenCalledWith({
        Id: mockUser.Id,
        UserName: mockUser.UserName, // Should preserve existing
        Password: '',
        BaseCurrency: CurrencyEnum.GBP
      });
    });
  });
});
