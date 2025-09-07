import { Component } from '@angular/core';
import { LoaderComponent } from '../loader/loader.component';

@Component({
  selector: 'wakeup-loader',
  templateUrl: './wakeup-loader.component.html',
  styleUrls: ['./wakeup-loader.component.scss'],
  standalone: true,
  imports: [LoaderComponent]
})
export class WakeupLoaderComponent {}