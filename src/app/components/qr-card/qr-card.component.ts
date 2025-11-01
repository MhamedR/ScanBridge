import { Component, effect, inject, signal } from '@angular/core';
import { ApiService, PairingInfo } from '../../services/api.service';
import QRCode from 'qrcode';

@Component({
  selector: 'app-qr-card',
  templateUrl: './qr-card.component.html',
  styleUrls: ['./qr-card.component.scss'],
  standalone: false,
})
export class QrCardComponent {
  private readonly apiService = inject(ApiService);
  private readonly refreshTrigger = signal(0);

  // Signals for state management
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly qrCodeDataUrl = signal<string | null>(null);
  readonly pairingUrl = signal('');

  constructor() {
    // Effect to reload pairing info when trigger changes
    effect(() => {
      const trigger = this.refreshTrigger();
      if (trigger > 0) {
        this.loading.set(true);
        this.error.set(null);

        this.apiService.getPairingInfo().subscribe({
          next: (info: PairingInfo) => {
            this.loading.set(false);
            this.error.set(null);
            this.pairingUrl.set(info.url);
            this.generateQRCode(info.url);
          },
          error: (err) => {
            console.error('Error loading pairing info:', err);
            this.error.set('Failed to load pairing information');
            this.loading.set(false);
          },
        });
      }
    });

    // Load initial pairing info
    this.refreshTrigger.set(1);
  }

  private async generateQRCode(url: string): Promise<void> {
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      this.qrCodeDataUrl.set(dataUrl);
    } catch (err) {
      console.error('Error generating QR code:', err);
      this.error.set('Failed to generate QR code');
      this.loading.set(false);
    }
  }

  refreshQRCode(): void {
    this.refreshTrigger.update((v) => v + 1);
  }
}

