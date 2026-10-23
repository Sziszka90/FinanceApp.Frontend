import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { submit } from '@angular/forms/signals';
import { ProfileComponent } from './profile.component';
import { AuthenticationService } from '../../../services/authentication.service';
import { UserApiService } from '../../../services/user.api.service';
import { ComponentErrorService } from '../../../services/component-error.service';
import { GetUserDto } from '../../../models/UserDtos/get-user.dto';
import { CurrencyEnum } from '../../../models/Enums/currency.enum';
import { BaseComponent } from 'src/app/shared/base-component';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let userApiService: jasmine.SpyObj<UserApiService>;
  let router: jasmine.SpyObj<Router>;

  const mockUser: GetUserDto = {
    id: '123',
    userName: 'testuser',
    email: 'test@example.com',
    baseCurrency: CurrencyEnum.EUR
  };

  beforeEach(async () => {
    const userApiSpy = jasmine.createSpyObj('UserApiService', ['getActiveUser', 'updateUser']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const errorServiceSpy = jasmine.createSpyObj('ComponentErrorService', ['showError', 'showSuccess', 'clearError', 'handleError'], {
      hasError: jasmine.createSpy().and.returnValue(false),
      errorMessage: jasmine.createSpy().and.returnValue('')
    });

    await TestBed.configureTestingModule({
      imports: [ProfileComponent, BrowserAnimationsModule],
      providers: [
        { provide: UserApiService, useValue: userApiSpy },
        { provide: AuthenticationService, useValue: jasmine.createSpyObj('AuthenticationService', ['logout']) },
        { provide: Router, useValue: routerSpy },
        { provide: ComponentErrorService, useValue: errorServiceSpy },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    userApiService = TestBed.inject(UserApiService) as jasmine.SpyObj<UserApiService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    userApiService.getActiveUser.and.returnValue(of(mockUser));
    userApiService.updateUser.and.returnValue(of(mockUser));
  });

  afterEach(() => fixture.destroy());

  it('creates and extends BaseComponent', () => {
    expect(component).toBeTruthy();
    expect(component instanceof BaseComponent).toBeTrue();
  });

  it('initializes a signal form with the default currency', () => {
    expect(component.profileModel().currency).toBe(CurrencyEnum.EUR);
    expect(component.profileForm().valid()).toBeTrue();
    expect(component.currencyOptions).toEqual([
      CurrencyEnum.USD,
      CurrencyEnum.EUR,
      CurrencyEnum.GBP,
      CurrencyEnum.HUF
    ]);
  });

  it('validates username and optional password through field state', () => {
    component.profileModel.update(model => ({ ...model, userName: 'a' }));
    expect(component.profileForm.userName().invalid()).toBeTrue();

    component.profileModel.update(model => ({ ...model, userName: 'ab', password: '' }));
    expect(component.profileForm().valid()).toBeTrue();

    component.profileModel.update(model => ({ ...model, password: 'short' }));
    expect(component.profileForm.password().errors().map(error => error.kind)).toContain('minLength');

    component.profileModel.update(model => ({ ...model, password: 'ValidPass123!' }));
    expect(component.profileForm.password().valid()).toBeTrue();
  });

  it('loads the active user into the signal model', () => {
    fixture.detectChanges();

    expect(userApiService.getActiveUser).toHaveBeenCalled();
    expect(component.user).toEqual(mockUser);
    expect(component.profileModel().userName).toBe(mockUser.userName);
    expect(component.profileModel().currency).toBe(mockUser.baseCurrency);
  });

  it('does not submit an invalid signal form', async () => {
    fixture.detectChanges();
    component.profileModel.update(model => ({ ...model, userName: 'a' }));

    await submit(component.profileForm);

    expect(userApiService.updateUser).not.toHaveBeenCalled();
  });

  it('submits the signal model and navigates after a successful update', async () => {
    fixture.detectChanges();
    component.profileModel.set({
      userName: 'newusername',
      password: 'NewPass123!',
      currency: CurrencyEnum.USD
    });

    await submit(component.profileForm);

    expect(userApiService.updateUser).toHaveBeenCalledWith({
      id: mockUser.id,
      userName: 'newusername',
      password: 'NewPass123!',
      baseCurrency: CurrencyEnum.USD
    });
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('falls back to the current username when the model username is empty', async () => {
    fixture.detectChanges();
    component.profileModel.set({
      userName: '',
      password: '',
      currency: CurrencyEnum.GBP
    });

    await submit(component.profileForm);

    expect(userApiService.updateUser).toHaveBeenCalledWith({
      id: mockUser.id,
      userName: mockUser.userName,
      password: '',
      baseCurrency: CurrencyEnum.GBP
    });
  });

  it('handles update errors without throwing', async () => {
    fixture.detectChanges();
    userApiService.updateUser.and.returnValue(throwError(() => new Error('Update Error')));
    component.profileModel.set({
      userName: 'newusername',
      password: '',
      currency: CurrencyEnum.USD
    });

    await expectAsync(submit(component.profileForm)).toBeResolvedTo(true);
  });
});