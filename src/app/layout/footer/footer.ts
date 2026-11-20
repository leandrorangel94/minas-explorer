import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'me-footer',
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {}
