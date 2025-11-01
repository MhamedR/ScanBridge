import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ScanPreviewComponent } from './scan-preview.component';
import { WebSocketService, ScanCompleteEvent } from '../../services/websocket.service';
import { Subject } from 'rxjs';

describe('ScanPreviewComponent', () => {
  let component: ScanPreviewComponent;
  let fixture: ComponentFixture<ScanPreviewComponent>;
  let webSocketService: WebSocketService;
  let snackBar: MatSnackBar;
  let scanCompleteSubject: Subject<ScanCompleteEvent>;

  beforeEach(async () => {
    scanCompleteSubject = new Subject<ScanCompleteEvent>();
    const webSocketServiceMock = {
      scanComplete$: scanCompleteSubject.asObservable(),
      notifyScanComplete: jest.fn(),
    };

    await TestBed.configureTestingModule({
      declarations: [ScanPreviewComponent],
      imports: [
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatSnackBarModule,
      ],
      providers: [
        provideNoopAnimations(),
        { provide: WebSocketService, useValue: webSocketServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScanPreviewComponent);
    component = fixture.componentInstance;
    webSocketService = TestBed.inject(WebSocketService);
    snackBar = TestBed.inject(MatSnackBar);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display empty state when no scan', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('No scans yet');
  });

  it('should update lastScan when scan complete event is received', (done) => {
    const mockEvent: ScanCompleteEvent = {
      fileName: 'scan_123.jpg',
      path: '/Users/test/Desktop/scan_123.jpg',
      deviceId: 'device-1',
    };

    fixture.detectChanges();

    scanCompleteSubject.next(mockEvent);

    setTimeout(() => {
      expect(component.lastScan()).toEqual(mockEvent);
      expect(component.lastScan()?.fileName).toBe('scan_123.jpg');
      done();
    }, 100);
  });

  it('should show snackbar notification on scan complete', (done) => {
    const snackBarSpy = jest.spyOn(snackBar, 'open');
    const mockEvent: ScanCompleteEvent = {
      fileName: 'scan_123.jpg',
      path: '/Users/test/Desktop/scan_123.jpg',
      deviceId: 'device-1',
    };

    fixture.detectChanges();
    scanCompleteSubject.next(mockEvent);

    setTimeout(() => {
      expect(snackBarSpy).toHaveBeenCalledWith(
        `Scan complete: ${mockEvent.fileName}`,
        'Open Folder',
        { duration: 5000 }
      );
      done();
    }, 100);
  });

  it('should handle openFolder when Electron is available', () => {
    const mockPath = '/Users/test/Desktop/scan_123.jpg';
    component.lastScan.set({
      fileName: 'scan_123.jpg',
      path: mockPath,
      deviceId: 'device-1',
    });

    // Mock window.require
    (window as any).require = jest.fn(() => ({
      shell: {
        openPath: jest.fn().mockResolvedValue('success'),
      },
      path: {
        dirname: jest.fn((path) => '/Users/test/Desktop'),
      },
    }));

    component.openFolder();

    expect((window as any).require).toHaveBeenCalledWith('electron');
  });

  it('should handle openFolder errors gracefully', (done) => {
    const snackBarSpy = jest.spyOn(snackBar, 'open');
    const mockPath = '/Users/test/Desktop/scan_123.jpg';
    component.lastScan.set({
      fileName: 'scan_123.jpg',
      path: mockPath,
      deviceId: 'device-1',
    });

    // Mock window.require to throw error
    (window as any).require = jest.fn(() => {
      throw new Error('Require failed');
    });

    component.openFolder();

    setTimeout(() => {
      expect(snackBarSpy).toHaveBeenCalledWith(
        'Unable to open folder',
        'Close',
        { duration: 2000 }
      );
      done();
    }, 100);
  });

  it('should handle multiple scan events', (done) => {
    const mockEvent1: ScanCompleteEvent = {
      fileName: 'scan1.jpg',
      path: '/path1',
      deviceId: 'device-1',
    };
    const mockEvent2: ScanCompleteEvent = {
      fileName: 'scan2.jpg',
      path: '/path2',
      deviceId: 'device-2',
    };

    fixture.detectChanges();
    scanCompleteSubject.next(mockEvent1);
    scanCompleteSubject.next(mockEvent2);

    setTimeout(() => {
      expect(component.lastScan()?.fileName).toBe('scan2.jpg');
      done();
    }, 100);
  });
});

