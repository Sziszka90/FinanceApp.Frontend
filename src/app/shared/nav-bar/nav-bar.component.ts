import { Component, ElementRef, HostListener, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthenticationService } from 'src/services/authentication.service';

@Component({
  selector: 'nav-bar',
  imports: [MatIconModule, TranslateModule, RouterLink, RouterLinkActive],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true
})
export class NavBarComponent implements OnInit {
  private authService = inject(AuthenticationService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  showMenu = signal<boolean>(false);
  userLoggedIn = signal<boolean>(false);

  ngOnInit() {
    this.authService.userLoggedIn.subscribe(isLoggedIn => {
      console.log('User logged in status changed:', isLoggedIn);
      this.userLoggedIn.set(isLoggedIn);
    });
  }

  async login() {
    const result = await this.authService.isAuthenticatedAsync();
    if (result) {
      this.router.navigateByUrl('/profile');
    } else {
      this.router.navigateByUrl('/login');
    }
  }

  menuToggle() {
    this.showMenu.set(!this.showMenu());
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as Node;
    const mobileNavigation = this.elementRef.nativeElement.querySelector('.mobile-navigation');
    const menuToggle = this.elementRef.nativeElement.querySelector('.mobile-menu-toggle');

    if (
      this.showMenu() &&
      !mobileNavigation?.contains(target) &&
      !menuToggle?.contains(target)
    ) {
      this.showMenu.set(false);
    }
  }
}
