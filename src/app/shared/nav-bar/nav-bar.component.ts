import { Component, ElementRef, HostListener, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthenticationService } from 'src/services/authentication.service';

@Component({
    selector: 'nav-bar',
    imports: [
      CommonModule,
      MatIconModule,
      TranslateModule,
      RouterLink
    ],
    templateUrl: './nav-bar.component.html',
    styleUrl: './nav-bar.component.scss',
    standalone: true
})
export class NavBarComponent implements OnInit {
  private authService = inject(AuthenticationService);
  private router = inject(Router)
  private elementRef = inject(ElementRef);

  showMenu = signal<boolean>(false);
  userLoggedIn = signal<boolean>(false);

  ngOnInit() {
    this.userLoggedIn.set(this.authService.isAuthenticated());
    this.authService.userLoggedIn.subscribe((isLoggedIn) => {
      this.userLoggedIn.set(isLoggedIn);
    });
  }

  login() {
    if(this.authService.isAuthenticated()){
      this.router.navigateByUrl('/logged-in');
    } else {
      this.router.navigateByUrl('/login');
    }
  }

  menuToggle() {
    this.showMenu.set(!this.showMenu());
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (
      this.showMenu &&
      !this.elementRef.nativeElement.querySelector('.custom-dropdown-minimized')?.contains(event.target as Node)
    ) {
      this.showMenu.set(false);
    }
  }
}
