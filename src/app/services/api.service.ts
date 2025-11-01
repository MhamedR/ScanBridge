import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface Device {
  id: string;
  name: string;
  connectedAt: string;
}

export interface PairingInfo {
  token: string;
  url: string;
  ip: string;
  port: number;
}

export interface ScanResult {
  success: boolean;
  path?: string;
  fileName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = 'http://localhost:3000';
  private readonly http = inject(HttpClient);

  // Use signal for devices instead of BehaviorSubject
  readonly devices = signal<Device[]>([]);

  getPairingInfo(): Observable<PairingInfo> {
    return this.http.get<PairingInfo>(`${this.baseUrl}/pairing`);
  }

  getDevices(): Observable<Device[]> {
    return this.http.get<Device[]>(`${this.baseUrl}/devices`).pipe(
      tap((devices) => this.devices.set(devices))
    );
  }

  sendScanCommand(deviceId: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/command/${deviceId}`,
      { type: 'scan' }
    );
  }

  refreshDevices(): void {
    this.getDevices().subscribe();
  }
}

