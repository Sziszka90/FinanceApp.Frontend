import { Component, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink } from '@angular/router';
import { AuthenticationService } from '../../../services/authentication.service';
import { MatButtonModule } from '@angular/material/button';
import { BaseComponent } from 'src/app/shared/base-component';

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
export class LoggedInComponent extends BaseComponent {
  public router = inject(Router);
  public authService = inject(AuthenticationService);

  async logout() {
    await this.authService.logoutAsync();
    this.router.navigate(['/login']);
  }
}
