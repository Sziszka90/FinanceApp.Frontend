import { Component, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink } from '@angular/router';
import { AuthenticationService } from '../../../services/authentication.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'logged-in',
  templateUrl: './logged-in.component.html',
  styleUrls: ['./logged-in.component.scss'],
  imports: [
    MatToolbarModule,
    MatButtonModule,
    RouterLink
  ]
})
export class LoggedInComponent {
  public router = inject(Router);
  public authService = inject(AuthenticationService);

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
