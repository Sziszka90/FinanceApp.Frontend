import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true
})
export class LoaderComponent {}
