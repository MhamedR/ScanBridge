import { Injectable, signal, effect, computed } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_STORAGE_KEY = 'scanbridge-theme';
  private readonly themeSignal = signal<Theme>(this.getInitialTheme());

  readonly theme = this.themeSignal.asReadonly();
  readonly isDark = computed(() => this.themeSignal() === 'dark');

  constructor() {
    // Load theme from storage
    this.loadTheme();

    // Apply theme when it changes
    effect(() => {
      const theme = this.themeSignal();
      this.applyTheme(theme);
      this.saveTheme(theme);
    });
  }

  toggleTheme(): void {
    this.themeSignal.update((current) => (current === 'light' ? 'dark' : 'light'));
  }

  setTheme(theme: Theme): void {
    this.themeSignal.set(theme);
  }

  private getInitialTheme(): Theme {
    // Check localStorage first
    const stored = localStorage.getItem(this.THEME_STORAGE_KEY) as Theme;
    if (stored && (stored === 'light' || stored === 'dark')) {
      return stored;
    }

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  }

  private loadTheme(): void {
    const theme = this.getInitialTheme();
    this.themeSignal.set(theme);
  }

  private saveTheme(theme: Theme): void {
    localStorage.setItem(this.THEME_STORAGE_KEY, theme);
  }

  private applyTheme(theme: Theme): void {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}

