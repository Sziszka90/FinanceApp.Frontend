import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';

import { NotificationService } from './notification.service';
import { AuthenticationService } from './authentication.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let authService: jasmine.SpyObj<AuthenticationService>;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthenticationService', [
      'isAuthenticated',
      'validateToken',
      'getToken',
      'getUserId',
      'logout'
    ], {
      userLoggedIn: new BehaviorSubject(false)
    });

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: AuthenticationService, useValue: authSpy }
      ]
    });

    authService = TestBed.inject(AuthenticationService) as jasmine.SpyObj<AuthenticationService>;

    authService.isAuthenticated.and.returnValue(false);
    authService.validateToken.and.returnValue(false);
    authService.getToken.and.returnValue('mock-token');
    authService.getUserId.and.returnValue('mock-user-id');

    service = TestBed.inject(NotificationService);
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize notifications$ as observable', () => {
      expect(service.notifications$).toBeDefined();
      expect(service.notifications$.subscribe).toBeInstanceOf(Function);
    });

    it('should have initial retry count of 0', () => {
      expect(service.getRetryCount()).toBe(0);
    });
  });

  describe('Start Connection', () => {
    it('should not start connection when no token available', () => {
      authService.getToken.and.returnValue(null);
      spyOn(console, 'warn');

      service.startConnection();

      expect(console.warn).toHaveBeenCalledWith('SignalR: No token available, cannot establish connection');
    });

    it('should not start connection when token validation fails', () => {
      authService.validateToken.and.returnValue(false);
      spyOn(console, 'warn');

      service.startConnection();

      expect(console.warn).toHaveBeenCalledWith('SignalR: Token validation failed, cannot establish connection');
    });

    it('should not start connection when token is empty', () => {
      authService.validateToken.and.returnValue(true);
      authService.getToken.and.returnValue('   ');
      spyOn(console, 'warn');

      service.startConnection();

      expect(console.warn).toHaveBeenCalledWith('SignalR: Token is empty, cannot establish connection');
    });
  });

  describe('Stop Connection', () => {
    it('should do nothing when no connection exists', () => {
      (service as any).hubConnection = null;

      expect(() => service.stopConnection()).not.toThrow();
    });
  });

  describe('Reset and Reconnect', () => {
    it('should reset retry count and stop connection', () => {
      (service as any).connectionRetryCount = 5;
      spyOn(service, 'stopConnection');

      service.resetAndReconnect();

      expect(service.getRetryCount()).toBe(0);
      expect(service.stopConnection).toHaveBeenCalled();
    });
  });

  describe('Notification Handling', () => {
    it('should emit notifications through notifications$ observable', (done) => {
      const testMessage = 'Test notification message';

      service.notifications$.subscribe((message) => {
        if (message === testMessage) {
          expect(message).toBe(testMessage);
          done();
        }
      });

      // Simulate receiving notification
      (service as any).notificationSubject.next(testMessage);
    });
  });

  describe('Authentication State Changes', () => {
    it('should stop connection when user logs out', () => {
      spyOn(service, 'stopConnection');

      // Simulate user logout
      (authService.userLoggedIn as BehaviorSubject<boolean>).next(false);

      expect(service.stopConnection).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple simultaneous connection attempts', () => {
      // Set up conditions so connection attempts will proceed
      authService.validateToken.and.returnValue(true);
      authService.getToken.and.returnValue('valid-token');
      spyOn(service, 'stopConnection');

      // Set up existing connection so stopConnection will be called
      (service as any).hubConnection = { stop: () => Promise.resolve() };

      service.startConnection();
      service.startConnection();
      service.startConnection();

      expect(service.stopConnection).toHaveBeenCalledTimes(3);
    });
  });
});
