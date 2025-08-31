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

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let authApiService: jasmine.SpyObj<AuthenticationApiService>;
  let tokenApiService: jasmine.SpyObj<TokenApiService>;
  let correlationService: jasmine.SpyObj<CorrelationService>;
  let router: jasmine.SpyObj<Router>;

  const mockLoginRequest: LoginRequestDto = {
    Email: 'test@example.com',
    Password: 'password123'
  };

  const mockLoginResponse: LoginResponseDto = {
    Token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJleHAiOjk5OTk5OTk5OTl9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
  };

  const mockValidateTokenResponse: ValidateTokenResponse = {
    IsValid: true
  };

  beforeEach(() => {
    const authApiSpy = jasmine.createSpyObj('AuthenticationApiService', ['login']);
    const tokenApiSpy = jasmine.createSpyObj('TokenApiService', ['verifyToken']);
    const correlationSpy = jasmine.createSpyObj('CorrelationService', ['clearAllCorrelationIds']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
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

  describe('Token Management', () => {
    it('should save token to localStorage', () => {
      const testToken = 'test-token';
      service.saveToken(testToken);
      expect(localStorage.getItem('authToken')).toBe(testToken);
    });

    it('should retrieve token from localStorage', () => {
      const testToken = 'test-token';
      localStorage.setItem('authToken', testToken);
      expect(service.getToken()).toBe(testToken);
    });

    it('should return null when no token stored', () => {
      expect(service.getToken()).toBeNull();
    });

    it('should validate token correctly when token exists and is valid', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const validToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ exp: futureExp, sub: '123' }))}.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;
      localStorage.setItem('authToken', validToken);

      expect(service.validateToken()).toBe(true);
    });

    it('should return false for expired token', () => {
      // Mock an expired token
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const expiredToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ exp: pastExp, sub: '123' }))}.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;
      localStorage.setItem('authToken', expiredToken);

      expect(service.validateToken()).toBe(false);
    });

    it('should return false for malformed token', () => {
      // Create a token with invalid base64 in the payload section
      localStorage.setItem('authToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid_base64_@#$.signature');
      expect(service.validateToken()).toBe(false);
    });

    it('should return false when no token exists', () => {
      expect(service.validateToken()).toBe(false);
    });
  });

  describe('Login Functionality', () => {
    it('should call authApiService.login with correct parameters', () => {
      service.login(mockLoginRequest).subscribe();
      expect(authApiService.login).toHaveBeenCalledWith(mockLoginRequest);
    });

    it('should return login response from API', (done) => {
      service.login(mockLoginRequest).subscribe((response) => {
        expect(response).toEqual(mockLoginResponse);
        done();
      });
    });

    it('should clear correlation IDs on login', () => {
      service.login(mockLoginRequest).subscribe();
      expect(correlationService.clearAllCorrelationIds).toHaveBeenCalled();
    });
  });

  describe('Logout Functionality', () => {
    beforeEach(() => {
      localStorage.setItem('authToken', 'test-token');
    });

    it('should clear token from localStorage on logout', () => {
      service.logout();
      expect(localStorage.getItem('authToken')).toBeNull();
    });

    it('should emit false on userLoggedIn subject after logout', (done) => {
      service.userLoggedIn.subscribe((isLoggedIn) => {
        expect(isLoggedIn).toBe(false);
        done();
      });

      service.logout();
    });

    it('should clear correlation IDs on logout', () => {
      service.logout();
      expect(correlationService.clearAllCorrelationIds).toHaveBeenCalled();
    });

    it('should navigate to login page on logout', () => {
      service.logout();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('Authentication Status', () => {
    it('should return true when user is authenticated with valid token', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const validToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ exp: futureExp, sub: '123' }))}.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;
      localStorage.setItem('authToken', validToken);

      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false when user is not authenticated', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return false when token is expired', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600;
      const expiredToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ exp: pastExp, sub: '123' }))}.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;
      localStorage.setItem('authToken', expiredToken);

      expect(service.isAuthenticated()).toBe(false);
    });

    it('should emit false when token validation fails', (done) => {
      service.userLoggedIn.subscribe((isLoggedIn) => {
        expect(isLoggedIn).toBe(false);
        done();
      });

      localStorage.setItem('authToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid_base64_@#$.signature');
      service.isAuthenticated();
    });
  });

  describe('API Token Validation', () => {
    it('should validate token via API and return true for valid token', (done) => {
      const testToken = 'test-token';

      service.validateTokenWithApi(testToken).subscribe((isValid) => {
        expect(isValid).toBe(true);
        expect(tokenApiService.verifyToken).toHaveBeenCalledWith(testToken);
        done();
      });
    });

    it('should return false when API validation fails', (done) => {
      tokenApiService.verifyToken.and.returnValue(of({ IsValid: false }));

      service.validateTokenWithApi('invalid-token').subscribe((isValid) => {
        expect(isValid).toBe(false);
        done();
      });
    });

    it('should handle API errors gracefully', (done) => {
      tokenApiService.verifyToken.and.returnValue(throwError(() => new Error('API Error')));

      service.validateTokenWithApi('test-token').subscribe((isValid) => {
        expect(isValid).toBe(false);
        done();
      });
    });
  });

  describe('User Information', () => {
    it('should return user ID from token', () => {
      const testUserId = '123';
      const tokenWithUserId = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ sub: testUserId, exp: 9999999999 }))}.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;
      localStorage.setItem('authToken', tokenWithUserId);

      expect(service.getUserId()).toBe(testUserId);
    });

    it('should return null when no token exists', () => {
      expect(service.getUserId()).toBeNull();
    });

    it('should return null when token is malformed', () => {
      localStorage.setItem('authToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid_base64_@#$.signature');
      expect(service.getUserId()).toBeNull();
    });

    it('should return null when token has no sub claim', () => {
      const tokenWithoutSub = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ exp: 9999999999 }))}.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;
      localStorage.setItem('authToken', tokenWithoutSub);

      expect(service.getUserId()).toBeNull();
    });
  });
});
