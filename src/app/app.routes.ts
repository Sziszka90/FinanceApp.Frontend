import { Routes, CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { TransactionComponent } from './transactions/transaction/transaction.component';
import { NotFoundComponent } from './shared/not-found/not-found.component';
import { HomeComponent } from './shared/home/home.component';
import { LoginComponent } from './user/login/login.component';
import { RegistrationComponent } from './user/registration/registration.component';
import { LoggedInComponent } from './user/logged-in/logged-in.component';
import { TransactionGroupComponent } from './transaction-groups/transaction-group/transaction-group.component';
import { ValidationFailedComponent } from './shared/validation-failed/validation-failed.component';
import { ResetPasswordComponent } from './user/reset-password/reset-password.component';
import { ProfileComponent } from './user/profile/profile.component';
import { inject } from '@angular/core';
import { AuthenticationService } from '../services/authentication.service';
import { ComponentErrorService } from 'src/services/component-error.service';

const AuthGuard: CanActivateFn = async () => {
  const authService = inject(AuthenticationService);
  const router = inject(Router);
  const componentErrorService = inject(ComponentErrorService);

  try {
    const result = await authService.isAuthenticatedAsync();
    if (result.isSuccess) {
      return true;
    } else {
      componentErrorService.showError(result.error ?? 'Authentication failed');
      router.navigate(['/login']);
      return false;
    }
  } catch {
    componentErrorService.showError('Authentication failed');
    router.navigate(['/login']);
    return false;
  }
};

const ResetPasswordGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthenticationService);
  const router = inject(Router);
  const token = route.queryParamMap.get('token');
  const result = await authService.validateTokenAsync(token ?? '');

  if (!result.isSuccess || result.data === false) {
    router.navigate(['/validation-failed']);
    return false;
  }
  return true;
};

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'logged-in', component: LoggedInComponent, canActivate: [AuthGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'registration', component: RegistrationComponent },
  { path: 'transactions', component: TransactionComponent, canActivate: [AuthGuard] },
  { path: 'transactions-groups', component: TransactionGroupComponent, canActivate: [AuthGuard] },
  { path: 'validation-failed', component: ValidationFailedComponent },
  { path: 'reset-password', component: ResetPasswordComponent, canActivate: [ResetPasswordGuard] },
  { path: '**', component: NotFoundComponent }
];
