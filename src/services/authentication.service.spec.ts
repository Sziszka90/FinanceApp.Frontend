import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { PLATFORM_ID } from '@angular/core';
import { AuthenticationService } from './authentication.service';
import { AuthenticationApiService } from './authentication.api.service';
import { CorrelationService } from './correlation.service';
import { TokenApiService } from './token.api.service';
import { LoginRequestDto } from '../models/LoginDtos/login-request.dto';
import { LoginResponseDto } from '../models/LoginDtos/login-response.dto';
import { ValidateTokenResponse } from '../models/UserDtos/validate-toke-response.dto';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { take } from 'rxjs/operators';
import { TokenType } from 'src/models/Enums/token-type.enum';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let authApiService: jasmine.SpyObj<AuthenticationApiService>;
  let tokenApiService: jasmine.SpyObj<TokenApiService>;
  let correlationService: jasmine.SpyObj<CorrelationService>;
  let router: jasmine.SpyObj<Router>;

  const mockLoginRequest: LoginRequestDto = {
    email: 'test@example.com',
    password: 'password123'
  };

  const mockLoginResponse: LoginResponseDto = {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJleHAiOjk5OTk5OTk5OTl9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
  };

  const mockValidateTokenResponse: ValidateTokenResponse = {
    isValid: true
  };

  beforeEach(() => {
    const authApiSpy = jasmine.createSpyObj('AuthenticationApiService', ['login', 'logout']);
    const tokenApiSpy = jasmine.createSpyObj('TokenApiService', ['verifyToken']);
    const correlationSpy = jasmine.createSpyObj('CorrelationService', ['clearAllCorrelationIds']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthenticationService,
        { provide: AuthenticationApiService, useValue: authApiSpy },
        { provide: TokenApiService, useValue: tokenApiSpy },
        { provide: CorrelationService, useValue: correlationSpy },
        { provide: Router, useValue: routerSpy },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(AuthenticationService);
    authApiService = TestBed.inject(AuthenticationApiService) as jasmine.SpyObj<AuthenticationApiService>;
    tokenApiService = TestBed.inject(TokenApiService) as jasmine.SpyObj<TokenApiService>;
    correlationService = TestBed.inject(CorrelationService) as jasmine.SpyObj<CorrelationService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Setup default spy returns
    authApiService.login.and.returnValue(of(mockLoginResponse));
    authApiService.logout.and.returnValue(of(void 0));
    tokenApiService.verifyToken.and.returnValue(of(mockValidateTokenResponse));

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Component Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize userLoggedIn as Subject', () => {
      expect(service.userLoggedIn).toBeInstanceOf(Subject);
    });
  });

  describe('Login Functionality', () => {
    it('should call authApiService.login with correct parameters', () => {
      service.loginAsync(mockLoginRequest);
      expect(authApiService.login).toHaveBeenCalledWith(mockLoginRequest);
    });

    it('should clear correlation IDs on login', async () => {
      await service.loginAsync(mockLoginRequest);
      expect(correlationService.clearAllCorrelationIds).toHaveBeenCalled();
    });
  });

  describe('Logout Functionality', () => {
    beforeEach(() => {
      localStorage.setItem('authToken', 'test-token');
    });

    it('should clear token from localStorage on logout', async () => {
      await service.logoutAsync();
      expect(localStorage.getItem('authToken')).toBeNull();
    });

    it('should emit false on userLoggedIn subject after logout', (done) => {
      service.userLoggedIn.pipe(take(1)).subscribe((isLoggedIn) => {
        expect(isLoggedIn).toBe(false);
        done();
      });

      service.logoutAsync();
    });

    it('should clear correlation IDs on logout', async () => {
      await service.logoutAsync();
      expect(correlationService.clearAllCorrelationIds).toHaveBeenCalled();
    });

    it('should navigate to login page on logout', async () => {
      await service.logoutAsync();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('Authentication Status', () => {
    it('should return false when user is not authenticated', async () => {
      expect(await service.isAuthenticatedAsync()).toEqual(false);
    });
  });
});
