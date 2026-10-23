import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LoaderComponent } from '../loader/loader.component';

@Component({
  selector: 'wakeup-loader',
  templateUrl: './wakeup-loader.component.html',
  styleUrls: ['./wakeup-loader.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [LoaderComponent]
})
export class WakeupLoaderComponent {}
