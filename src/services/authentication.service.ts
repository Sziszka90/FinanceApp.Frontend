import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { LoginRequestDto } from '../models/LoginDtos/login-request.dto';
import { catchError, map, Observable, of, Subject } from 'rxjs';
import { LoginResponseDto } from '../models/LoginDtos/login-response.dto';
import { jwtDecode } from 'jwt-decode';
import { TOKEN_KEY } from 'src/models/Constants/token.const';
import { Router } from '@angular/router';
import { AuthenticationApiService } from './authentication.api.service';
import { CorrelationService } from './correlation.service';
import { TokenApiService } from './token.api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private authApiService = inject(AuthenticationApiService);
  private tokenApiService = inject(TokenApiService);
  private correlationService = inject(CorrelationService);

  private readonly tokenKey: string = TOKEN_KEY;
  public userLoggedIn: Subject<boolean> = new Subject<boolean>();

  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.correlationService.clearAllCorrelationIds();
    this.userLoggedIn.next(false);
    this.router.navigate(['/login']);
  }

  login(loginRequestDto: LoginRequestDto): Observable<LoginResponseDto> {
    this.correlationService.clearAllCorrelationIds();
    return this.authApiService.login(loginRequestDto);
  }

  isAuthenticated(): boolean {
    if (!this.validateToken()) {
      this.userLoggedIn.next(false);
      return false;
    }
    this.userLoggedIn.next(true);
    return true;
  }

  validateToken(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    try {
      const decodedToken: { exp: number; [key: string]: unknown } = jwtDecode(token);

      const currentTime = Math.floor(Date.now() / 1000);
      if (decodedToken.exp < currentTime) {
        console.warn('Token has expired.');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Invalid token format:', error);
      return false;
    }
  }

  validateTokenWithApi(token: string): Observable<boolean> {
    return this.tokenApiService.verifyToken(token).pipe(
      map((response) => response.isValid),
      catchError(() => of(false))
    );
  }

  getUserId(): string | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const decodedToken: { sub?: string; [key: string]: unknown } = jwtDecode(token);
      return decodedToken.sub || null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
}

