import { TestBed } from '@angular/core/testing';
import { AuthenticationService } from './authentication.service';
import { AuthenticationApiService } from './authentication.api.service';
import { CorrelationService } from './correlation.service';
import { UserApiService } from './user.api.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginRequestDto } from '../models/LoginDtos/login-request.dto';
import { LoginResponseDto } from '../models/LoginDtos/login-response.dto';
import { HttpClientTestingModule } from '@angular/common/http/testing';

// Mock services
class MockAuthApiService {
  login = jasmine.createSpy().and.returnValue(of({} as LoginResponseDto));
  logout = jasmine.createSpy().and.returnValue(of(undefined));
}
class MockCorrelationService {
  clearAllCorrelationIds = jasmine.createSpy();
}
class MockUserApiService {
  getActiveUser = jasmine.createSpy().and.returnValue(of({ email: 'user123@example.com' }));
}
class MockRouter {
  navigate = jasmine.createSpy();
  navigateByUrl = jasmine.createSpy();
}

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let authApi: MockAuthApiService;
  let correlation: MockCorrelationService;
  let userApi: MockUserApiService;
  let router: MockRouter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthenticationService,
        { provide: AuthenticationApiService, useClass: MockAuthApiService },
        { provide: CorrelationService, useClass: MockCorrelationService },
        { provide: UserApiService, useClass: MockUserApiService },
        { provide: Router, useClass: MockRouter }
      ]
    });
    service = TestBed.inject(AuthenticationService);
    authApi = TestBed.inject(AuthenticationApiService) as any;
    correlation = TestBed.inject(CorrelationService) as any;
    userApi = TestBed.inject(UserApiService) as any;
    router = TestBed.inject(Router) as any;
  });

  it('should login and set userLoggedIn to true', async () => {
    const dto: LoginRequestDto = { email: 'test@test.com', password: 'pass' };
    await service.loginAsync(dto);
    expect(authApi.login).toHaveBeenCalledWith(dto);
    expect(correlation.clearAllCorrelationIds).toHaveBeenCalled();
    expect(service.userLoggedIn.value).toBeTrue();
  });

  it('should logout and set userLoggedIn to false', async () => {
    await service.logoutAsync();
    expect(authApi.logout).toHaveBeenCalled();
    expect(correlation.clearAllCorrelationIds).toHaveBeenCalled();
    expect(service.userLoggedIn.value).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should return true for isAuthenticatedAsync when user exists', async () => {
    const result = await service.isAuthenticatedAsync();
    expect(userApi.getActiveUser).toHaveBeenCalled();
    expect(result).toBeTrue();
    expect(service.userLoggedIn.value).toBeTrue();
  });

  it('should return false for isAuthenticatedAsync when user fetch fails', async () => {
    userApi.getActiveUser.and.returnValue(throwError(() => new Error('fail')));
    const result = await service.isAuthenticatedAsync();
    expect(result).toBeFalse();
    expect(service.userLoggedIn.value).toBeFalse();
  });

  it('should get user email', async () => {
    const email = await service.getUserEmail();
    expect(email).toBe('user123@example.com');
  });

  it('should throw error if getUserEmail fails', async () => {
    userApi.getActiveUser.and.returnValue(throwError(() => new Error('fail')));
    await expectAsync(service.getUserEmail()).toBeRejectedWithError('Error fetching user email');
  });
});
