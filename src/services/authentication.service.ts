import { inject, Injectable } from '@angular/core';
import { LoginRequestDto } from '../models/LoginDtos/login-request.dto';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { AuthenticationApiService } from './authentication.api.service';
import { CorrelationService } from './correlation.service';
import { UserApiService } from './user.api.service';
import { TokenType } from 'src/models/Enums/token-type.enum';
import { TokenApiService } from './token.api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private router = inject(Router);
  private authApiService = inject(AuthenticationApiService);
  private correlationService = inject(CorrelationService);
  private userService = inject(UserApiService);
  private tokenApiService = inject(TokenApiService);

  public userLoggedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  async logoutAsync(): Promise<void> {
    try {
      await firstValueFrom(this.authApiService.logout());
      this.correlationService.clearAllCorrelationIds();
      this.userLoggedIn.next(false);
      this.router.navigate(['/login']);
    } catch {
      throw new Error('Logout failed. Please try again later.');
    }
  }

  async loginAsync(loginRequestDto: LoginRequestDto): Promise<void> {
    await firstValueFrom(this.authApiService.login(loginRequestDto));
    this.correlationService.clearAllCorrelationIds();
    this.userLoggedIn.next(true);
  }

  async isAuthenticatedAsync(): Promise<boolean> {
    try {
      const result = await firstValueFrom(this.authApiService.isAuthenticated());
      this.userLoggedIn.next(result);
      return result;
    } catch {
      this.userLoggedIn.next(false);
      return false;
    }
  }

  async getUserEmail(): Promise<string> {
    try {
      const user = await firstValueFrom(this.userService.getActiveUser());
      return user?.email;
    } catch {
      throw new Error('Error fetching user email');
    }
  }

  async validateTokenAsync(token: string, tokenType = TokenType.Login): Promise<boolean> {
    let result;
    try {
      result = await firstValueFrom(this.tokenApiService.verifyToken({ token, tokenType: tokenType }));
    } catch {
      throw new Error('Error verifying token');
    }

    if (!result.isValid) {
      await this.logoutAsync();
      return false;
    }
    return true;
  }
}

