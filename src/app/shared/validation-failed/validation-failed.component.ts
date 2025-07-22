import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'validation-failed',
  templateUrl: './validation-failed.component.html',
  styleUrls: ['./validation-failed.component.scss'],
  imports: [
  ]
})
export class ValidationFailedComponent {
  private router = inject(Router);

  onClose() {
    this.router.navigate(['/']);
  }
}
