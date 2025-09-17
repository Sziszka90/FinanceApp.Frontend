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

    it('should validate token correctly when token exists and is valid', async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const validToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ exp: futureExp, sub: '123' }))}.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;
      localStorage.setItem('authToken', validToken);

      expect(await service.validateTokenAsync()).toEqual(true);
    });

    it('should return false for expired token', async () => {
      // Mock an expired token
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const expiredToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ exp: pastExp, sub: '123' }))}.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;
      localStorage.setItem('authToken', expiredToken);

      expect(await service.validateTokenAsync()).toEqual(false);
    });

    it('should return false for malformed token', async () => {
      // Create a token with invalid base64 in the payload section
      localStorage.setItem('authToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid_base64_@#$.signature');
      expect(await service.validateTokenAsync()).toEqual(false);
    });

    it('should return false when no token exists', async () => {
      expect(await service.validateTokenAsync()).toEqual(false);
    });
  });

  describe('Login Functionality', () => {
    it('should call authApiService.login with correct parameters', () => {
      service.loginAsync(mockLoginRequest);
      expect(authApiService.login).toHaveBeenCalledWith(mockLoginRequest);
    });

    it('should return login response from API', async () => {
      const response = await service.loginAsync(mockLoginRequest);
      expect(response).toEqual(mockLoginResponse);
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
    it('should return true when user is authenticated with valid token', async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const validToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ exp: futureExp, sub: '123' }))}.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;
      localStorage.setItem('authToken', validToken);

      expect(await service.isAuthenticatedAsync()).toEqual(true);
    });

    it('should return false when user is not authenticated', async () => {
      expect(await service.isAuthenticatedAsync()).toEqual(false);
    });

    it('should return false when token is expired', async () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600;
      const expiredToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ exp: pastExp, sub: '123' }))}.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;
      localStorage.setItem('authToken', expiredToken);

      expect(await service.isAuthenticatedAsync()).toEqual(false);
    });

    it('should emit false when token validation fails', () => {
      service.userLoggedIn.subscribe((isLoggedIn) => {
        expect(isLoggedIn).toBe(false);
      });

      localStorage.setItem('authToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid_base64_@#$.signature');
      service.isAuthenticatedAsync();
    });
  });

  describe('API Token Validation', () => {
    it('should validate token via API and return true for valid token', async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const validToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ exp: futureExp, sub: '123' }))}.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;
      localStorage.setItem('authToken', validToken);

      tokenApiService.verifyToken.and.returnValue(of({ isValid: true }));

      const result = await service.validateTokenAsync(validToken);
      expect(result).toEqual(true);
      expect(tokenApiService.verifyToken).toHaveBeenCalledWith({ token: validToken, tokenType: TokenType.Login });
    });
  });

  it('should return false when API validation fails', async () => {
    tokenApiService.verifyToken.and.returnValue(of({ isValid: false }));

    const result = await service.validateTokenAsync('invalid-token');
    expect(result).toEqual(false);
  });

  it('should handle API errors gracefully', async () => {
    tokenApiService.verifyToken.and.returnValue(throwError(() => new Error('API Error')));

    const result = await service.validateTokenAsync('test-token');
    expect(result).toEqual(false);
  });
});

describe('User Information', () => {
  let service: AuthenticationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthenticationService]
    });
    service = TestBed.inject(AuthenticationService);
  });

  it('should return user ID from token', () => {
    const testUserId = '123';
    const tokenWithUserId = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ sub: testUserId, exp: 9999999999 }))}.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;
    localStorage.setItem('authToken', tokenWithUserId);

    expect(service.getUserId()).toBe(testUserId);
  });

  it('should return null when no token exists', () => {
    localStorage.removeItem('authToken');
    expect(service.getUserId()).toBeNull();
  });

  it('should throw error when token is malformed', () => {
    localStorage.setItem('authToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid_base64_@#$.signature');
    expect(() => service.getUserId()).toThrowError('Error decoding token');
  });

  it('should return null when token has no sub claim', () => {
    const tokenWithoutSub = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ exp: 9999999999 }))}.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;
    localStorage.setItem('authToken', tokenWithoutSub);

    expect(service.getUserId()).toBeNull();
  });
});
