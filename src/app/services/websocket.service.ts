import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface ScanCompleteEvent {
  fileName: string;
  path: string;
  deviceId: string;
}

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private scanCompleteSubject = new Subject<ScanCompleteEvent>();
  public scanComplete$: Observable<ScanCompleteEvent> = this.scanCompleteSubject.asObservable();

  constructor() {
    // Listen for messages from Electron main process
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      
      ipcRenderer.on('scan-complete', (event: any, data: ScanCompleteEvent) => {
        this.scanCompleteSubject.next(data);
      });

      ipcRenderer.on('device-update', (event: any, data: any) => {
        // Handle device updates if needed
        console.log('Device update:', data);
      });
    }
  }

  notifyScanComplete(event: ScanCompleteEvent): void {
    this.scanCompleteSubject.next(event);
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    require: any;
  }
}

