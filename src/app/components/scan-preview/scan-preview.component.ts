import { Component, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { WebSocketService, ScanCompleteEvent } from '../../services/websocket.service';

@Component({
  selector: 'app-scan-preview',
  templateUrl: './scan-preview.component.html',
  styleUrls: ['./scan-preview.component.scss'],
  standalone: false,
})
export class ScanPreviewComponent {
  private readonly websocketService = inject(WebSocketService);
  private readonly snackBar = inject(MatSnackBar);

  // Use signal for last scan
  readonly lastScan = signal<ScanCompleteEvent | null>(null);

  constructor() {
    // Subscribe to scan complete events
    this.websocketService.scanComplete$.subscribe((event) => {
      this.lastScan.set(event);
      this.snackBar.open(`Scan complete: ${event.fileName}`, 'Open Folder', {
        duration: 5000,
      });
    });
  }

  openFolder(): void {
    const scan = this.lastScan();
    if (scan?.path) {
      // Use Electron to open folder
      if (window.require) {
        try {
          const { shell } = window.require('electron');
          const pathModule = window.require('path');
          const folderPath = pathModule.dirname(scan.path);
          shell.openPath(folderPath).catch((err: any) => {
            console.error('Error opening folder:', err);
            this.snackBar.open('Failed to open folder', 'Close', {
              duration: 2000,
            });
          });
        } catch (err) {
          console.error('Error requiring Electron modules:', err);
          this.snackBar.open('Unable to open folder', 'Close', {
            duration: 2000,
          });
        }
      }
    }
  }
}

