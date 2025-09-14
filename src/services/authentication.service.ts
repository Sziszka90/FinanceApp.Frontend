import { inject, Injectable } from '@angular/core';
import { LoginRequestDto } from '../models/LoginDtos/login-request.dto';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { LoginResponseDto } from '../models/LoginDtos/login-response.dto';
import { jwtDecode } from 'jwt-decode';
import { TOKEN_KEY } from 'src/models/Constants/token.const';
import { Router } from '@angular/router';
import { AuthenticationApiService } from './authentication.api.service';
import { CorrelationService } from './correlation.service';
import { TokenApiService } from './token.api.service';
import { Result } from 'src/models/Result/result';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private router = inject(Router);
  private authApiService = inject(AuthenticationApiService);
  private tokenApiService = inject(TokenApiService);
  private correlationService = inject(CorrelationService);

  private readonly tokenKey: string = TOKEN_KEY;
  public userLoggedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  async logoutAsync(): Promise<Result<boolean>> {
    try {
      await firstValueFrom(this.authApiService.logout());
      localStorage.removeItem(this.tokenKey);
      this.correlationService.clearAllCorrelationIds();
      this.userLoggedIn.next(false);
      this.router.navigate(['/login']);
      return { isSuccess: true, data: true };
    } catch {
      return { isSuccess: false, error: 'Logout failed. Please try again later.' };
    }
  }

  async loginAsync(loginRequestDto: LoginRequestDto): Promise<Result<LoginResponseDto>> {
    try {
      const result = await firstValueFrom(this.authApiService.login(loginRequestDto));
      this.correlationService.clearAllCorrelationIds();
      this.saveToken(result.token);
      this.userLoggedIn.next(true);
      return { isSuccess: true, data: result };
    } catch {
      return { isSuccess: false, error: 'Login failed. Please check your credentials and try again.' };
    }
  }

  async isAuthenticatedAsync(): Promise<Result<boolean>> {
    const result = await this.validateTokenAsync();
    if (!result.isSuccess) {
      this.userLoggedIn.next(false);
      return { isSuccess: false, error: 'User is not authenticated.' };
    }
    this.userLoggedIn.next(true);
    return { isSuccess: true, data: result.data };
  }

  async validateTokenAsync(tokenToValidate = ''): Promise<Result<boolean>> {
    let token = tokenToValidate;
    if (token === '') {
      token = this.getToken() ?? '';
    }

    if (!token) {
      return { isSuccess: false, error: 'No token found.' };
    }

    try {
      const decodedToken: { exp: number; [key: string]: unknown } = jwtDecode(token);
      const currentTime = Math.floor(Date.now() / 1000);

      if (decodedToken.exp < currentTime) {
        console.warn('Token has expired.');
        return { isSuccess: false, error: 'Token has expired.' };
      }
    } catch (error) {
      console.error('Invalid token format:', error);
      return { isSuccess: false, error: 'Invalid token format.' };
    }

    try {
      const result = await firstValueFrom(this.tokenApiService.verifyToken(token));
      if (!result.isValid) {
        const logoutResult = await this.logoutAsync();
        if (!logoutResult.isSuccess) {
          console.error('Logout failed after token invalidation:', logoutResult.error);
          return { isSuccess: false, error: 'Logout failed after token invalidation.' };
        }
      }
      return { isSuccess: true, data: result.isValid };
    } catch (error) {
      console.error('Error verifying token:', error);
      return { isSuccess: false, error: 'Error verifying token.' };
    }
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

