import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TokenApiService } from './token.api.service';
import { ValidateTokenResponse } from '../models/UserDtos/validate-toke-response.dto';

describe('TokenApiService', () => {
  let service: TokenApiService;
  let httpMock: HttpTestingController;

  const mockEnvironment = {
    apiUrl: 'https://api.example.com'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TokenApiService]
    });

    service = TestBed.inject(TokenApiService);
    httpMock = TestBed.inject(HttpTestingController);

    // Mock environment
    (service as any).apiUrl = mockEnvironment.apiUrl;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have apiUrl set from environment', () => {
      expect((service as any).apiUrl).toBe(mockEnvironment.apiUrl);
    });
  });

  describe('verifyToken', () => {
    const testToken = 'test-jwt-token';
    const expectedUrl = `${mockEnvironment.apiUrl}/api/v1/token/validate`;

    it('should send POST request to validate endpoint', () => {
      const mockResponse: ValidateTokenResponse = { isValid: true };

      service.verifyToken(testToken).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ Token: testToken });
      req.flush(mockResponse);
    });

    it('should return valid token response', () => {
      const mockResponse: ValidateTokenResponse = { isValid: true };

      service.verifyToken(testToken).subscribe((response) => {
        expect(response.isValid).toBe(true);
      });

      const req = httpMock.expectOne(expectedUrl);
      req.flush(mockResponse);
    });

    it('should return invalid token response', () => {
      const mockResponse: ValidateTokenResponse = { isValid: false };

      service.verifyToken(testToken).subscribe((response) => {
        expect(response.isValid).toBe(false);
      });

      const req = httpMock.expectOne(expectedUrl);
      req.flush(mockResponse);
    });

    it('should handle HTTP errors', () => {
      service.verifyToken(testToken).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(expectedUrl);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network errors', () => {
      service.verifyToken(testToken).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.error).toBeInstanceOf(ProgressEvent);
        }
      });

      const req = httpMock.expectOne(expectedUrl);
      req.error(new ProgressEvent('Network error'));
    });

    it('should handle special characters in token', () => {
      const specialToken = 'token-with.special_characters+and=symbols';

      service.verifyToken(specialToken).subscribe();

      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.body).toEqual({ Token: specialToken });
      req.flush({ isValid: true });
    });
  });

  describe('Error Handling', () => {
    const testToken = 'test-token';
    const expectedUrl = `${mockEnvironment.apiUrl}/api/v1/token/validate`;

    it('should handle 401 Unauthorized', () => {
      service.verifyToken(testToken).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
          expect(error.statusText).toBe('Unauthorized');
        }
      });

      const req = httpMock.expectOne(expectedUrl);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle 403 Forbidden', () => {
      service.verifyToken(testToken).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(403);
        }
      });

      const req = httpMock.expectOne(expectedUrl);
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });

    it('should handle 404 Not Found', () => {
      service.verifyToken(testToken).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(expectedUrl);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle 422 Unprocessable Entity', () => {
      service.verifyToken(testToken).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(422);
        }
      });

      const req = httpMock.expectOne(expectedUrl);
      req.flush('Validation Error', { status: 422, statusText: 'Unprocessable Entity' });
    });

    it('should handle timeout errors', () => {
      service.verifyToken(testToken).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(0);
        }
      });

      const req = httpMock.expectOne(expectedUrl);
      req.error(new ProgressEvent('timeout'));
    });
  });

  describe('API URL Configuration', () => {
    it('should handle empty API URL', () => {
      (service as any).apiUrl = '';
      const testToken = 'test-token';

      service.verifyToken(testToken).subscribe();

      const req = httpMock.expectOne('/api/v1/token/validate');
      expect(req.request.url).toBe('/api/v1/token/validate');
      req.flush({ isValid: true });
    });

    it('should handle API URL with trailing slash', () => {
      (service as any).apiUrl = 'https://api.example.com/';
      const testToken = 'test-token';

      service.verifyToken(testToken).subscribe();

      const req = httpMock.expectOne('https://api.example.com//api/v1/token/validate');
      expect(req.request.url).toBe('https://api.example.com//api/v1/token/validate');
      req.flush({ isValid: true });
    });

    it('should handle null API URL', () => {
      (service as any).apiUrl = null;
      const testToken = 'test-token';

      service.verifyToken(testToken).subscribe();

      const req = httpMock.expectOne('null/api/v1/token/validate');
      expect(req.request.url).toBe('null/api/v1/token/validate');
      req.flush({ isValid: true });
    });
  });

  describe('Request Body Format', () => {
    it('should format request body with capital T in Token', () => {
      const testToken = 'test-token';

      service.verifyToken(testToken).subscribe();

      const req = httpMock.expectOne((service as any).apiUrl + '/api/v1/token/validate');
      expect(req.request.body).toEqual({ Token: testToken });
      expect(req.request.body).not.toEqual({ token: testToken });
      req.flush({ isValid: true });
    });

    it('should preserve token exactly as provided', () => {
      const complexToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      service.verifyToken(complexToken).subscribe();

      const req = httpMock.expectOne((service as any).apiUrl + '/api/v1/token/validate');
      expect(req.request.body.Token).toBe(complexToken);
      req.flush({ isValid: true });
    });
  });

  describe('Observable Behavior', () => {
    it('should return Observable that completes', () => {
      const testToken = 'test-token';
      let completed = false;

      service.verifyToken(testToken).subscribe({
        complete: () => {
          completed = true;
        }
      });

      const req = httpMock.expectOne((service as any).apiUrl + '/api/v1/token/validate');
      req.flush({ isValid: true });

      expect(completed).toBe(true);
    });

    it('should be cold observable', () => {
      const testToken = 'test-token';
      const observable = service.verifyToken(testToken);

      // Should not make HTTP request until subscribed
      httpMock.expectNone((service as any).apiUrl + '/api/v1/token/validate');

      observable.subscribe();

      const req = httpMock.expectOne((service as any).apiUrl + '/api/v1/token/validate');
      expect(req.request.url).toBe((service as any).apiUrl + '/api/v1/token/validate');
      req.flush({ isValid: true });
    });

    it('should allow multiple subscriptions', () => {
      const testToken = 'test-token';
      const observable = service.verifyToken(testToken);

      observable.subscribe();
      observable.subscribe();

      // Should make two separate HTTP requests
      const requests = httpMock.match((service as any).apiUrl + '/api/v1/token/validate');
      expect(requests.length).toBe(2);

      requests.forEach(req => req.flush({ isValid: true }));
    });
  });
});
