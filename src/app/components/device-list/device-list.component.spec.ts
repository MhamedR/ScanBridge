import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { DeviceListComponent } from './device-list.component';
import { ApiService, Device } from '../../services/api.service';
import { of, throwError } from 'rxjs';

describe('DeviceListComponent', () => {
  let component: DeviceListComponent;
  let fixture: ComponentFixture<DeviceListComponent>;
  let apiService: jest.Mocked<ApiService>;
  let snackBar: MatSnackBar;

  beforeEach(async () => {
    // Create a proper signal mock that can be called as a function
    const mockDevices: Device[] = [];
    const devicesSignal = jest.fn(() => mockDevices) as any;
    devicesSignal.set = jest.fn((newDevices: Device[]) => {
      mockDevices.length = 0;
      mockDevices.push(...newDevices);
    });
    devicesSignal.update = jest.fn();
    devicesSignal.asReadonly = jest.fn(() => devicesSignal);

    const apiServiceMock = {
      getDevices: jest.fn(() => of([])),
      sendScanCommand: jest.fn(),
      devices: devicesSignal,
    };

    await TestBed.configureTestingModule({
      declarations: [DeviceListComponent],
      imports: [
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatSnackBarModule,
      ],
      providers: [
        provideHttpClient(),
        provideNoopAnimations(),
        { provide: ApiService, useValue: apiServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeviceListComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService) as jest.Mocked<ApiService>;
    snackBar = TestBed.inject(MatSnackBar);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load devices on init', (done) => {
    const mockDevices: Device[] = [
      {
        id: 'device-1',
        name: 'Test Device 1',
        connectedAt: new Date().toISOString(),
      },
      {
        id: 'device-2',
        name: 'Test Device 2',
        connectedAt: new Date().toISOString(),
      },
    ];

    apiService.getDevices.mockReturnValue(of(mockDevices));

    fixture.detectChanges();

    // Manually trigger the device update
    apiService.devices.set(mockDevices);

    setTimeout(() => {
      expect(component.devices()).toEqual(mockDevices);
      expect(component.devices().length).toBe(2);
      done();
    }, 100);
  });

  it('should display empty state when no devices', () => {
    apiService.getDevices.mockReturnValue(of([]));
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('No devices connected');
  });

  it('should trigger scan command', (done) => {
    const mockDevice: Device = {
      id: 'device-1',
      name: 'Test Device',
      connectedAt: new Date().toISOString(),
    };

    apiService.sendScanCommand.mockReturnValue(
      of({ success: true, message: 'Command sent' })
    );

    const snackBarSpy = jest.spyOn(snackBar, 'open');

    component.triggerScan(mockDevice);

    setTimeout(() => {
      expect(apiService.sendScanCommand).toHaveBeenCalledWith('device-1');
      expect(snackBarSpy).toHaveBeenCalledWith(
        `Scan command sent to ${mockDevice.name}`,
        'Close',
        { duration: 2000 }
      );
      expect(component.loading()).toBe(false);
      done();
    }, 100);
  });

  it('should handle scan command errors', (done) => {
    const mockDevice: Device = {
      id: 'device-1',
      name: 'Test Device',
      connectedAt: new Date().toISOString(),
    };

    apiService.sendScanCommand.mockReturnValue(
      throwError(() => ({ status: 404, message: 'Not Found' }))
    );

    const snackBarSpy = jest.spyOn(snackBar, 'open');

    component.triggerScan(mockDevice);

    setTimeout(() => {
      expect(snackBarSpy).toHaveBeenCalledWith(
        `Failed to send scan command to ${mockDevice.name}`,
        'Close',
        { duration: 3000 }
      );
      expect(component.loading()).toBe(false);
      done();
    }, 100);
  });

  it('should format date correctly', () => {
    const now = new Date();
    const recent = new Date(now.getTime() - 30000); // 30 seconds ago

    expect(component.formatDate(recent.toISOString())).toBe('just now');

    const minutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
    const formatted = component.formatDate(minutesAgo.toISOString());
    expect(formatted).toContain('minute');
  });

  it('should unsubscribe interval on destroy', () => {
    const unsubscribeSpy = jest.spyOn(component['intervalSubscription']!, 'unsubscribe');

    component.ngOnDestroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});

