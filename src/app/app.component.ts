import { Component, OnInit, inject } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-in', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
    ]),
  ],
})
export class AppComponent implements OnInit {
  private readonly themeService = inject(ThemeService);

  title = 'ScanBridge';
  readonly isDark = this.themeService.isDark;
  readonly theme = this.themeService.theme;

  ngOnInit(): void {
    // Component initialization
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}

