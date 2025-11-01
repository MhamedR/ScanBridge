import { Component, computed, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService, Device } from '../../services/api.service';
import { interval, catchError, of, Subscription } from 'rxjs';

@Component({
  selector: 'app-device-list',
  templateUrl: './device-list.component.html',
  styleUrls: ['./device-list.component.scss'],
  standalone: false,
})
export class DeviceListComponent {
  private readonly apiService = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);
  private intervalSubscription?: Subscription;

  // Signals for state management
  readonly loading = signal(false);

  // Use signal from service directly
  readonly devices = this.apiService.devices;

  // Computed signal for empty state
  readonly hasDevices = computed(() => this.devices().length > 0);

  constructor() {
    // Load devices initially
    this.loadDevices();

    // Auto-refresh devices every 2 seconds
    this.intervalSubscription = interval(2000).subscribe(() => {
      this.loadDevices();
    });
  }

  ngOnDestroy(): void {
    this.intervalSubscription?.unsubscribe();
  }

  loadDevices(): void {
    this.apiService.getDevices().pipe(
      catchError((err) => {
        console.error('Error loading devices:', err);
        return of([]);
      })
    ).subscribe({
      next: (devices) => {
        this.apiService.devices.set(devices);
      },
    });
  }

  triggerScan(device: Device): void {
    this.loading.set(true);
    this.apiService.sendScanCommand(device.id).subscribe({
      next: (response) => {
        this.snackBar.open(`Scan command sent to ${device.name}`, 'Close', {
          duration: 2000,
        });
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error sending scan command:', err);
        this.snackBar.open(
          `Failed to send scan command to ${device.name}`,
          'Close',
          {
            duration: 3000,
          }
        );
        this.loading.set(false);
      },
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 60) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleTimeString();
    }
  }
}

