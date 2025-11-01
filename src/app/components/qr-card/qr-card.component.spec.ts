import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { QrCardComponent } from './qr-card.component';
import { ApiService, PairingInfo } from '../../services/api.service';
import { of, throwError } from 'rxjs';

// Mock QRCode
jest.mock('qrcode', () => ({
  __esModule: true,
  default: {
    toDataURL: jest.fn((url: string) => Promise.resolve(`data:image/png;base64,${url}`)),
  },
}));

describe('QrCardComponent', () => {
  let component: QrCardComponent;
  let fixture: ComponentFixture<QrCardComponent>;
  let apiService: jest.Mocked<ApiService>;

  beforeEach(async () => {
    const apiServiceMock = {
      getPairingInfo: jest.fn(),
    };

    await TestBed.configureTestingModule({
      declarations: [QrCardComponent],
      imports: [
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
      ],
      providers: [
        provideHttpClient(),
        provideNoopAnimations(),
        { provide: ApiService, useValue: apiServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QrCardComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService) as jest.Mocked<ApiService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load pairing info on init', (done) => {
    const mockPairingInfo: PairingInfo = {
      token: 'test-token',
      url: 'http://192.168.1.100:3000/mobile?token=test-token',
      ip: '192.168.1.100',
      port: 3000,
    };

    apiService.getPairingInfo.mockReturnValue(of(mockPairingInfo));

    fixture.detectChanges();

    setTimeout(() => {
      expect(component.pairingUrl()).toBe(mockPairingInfo.url);
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
      done();
    }, 100);
  });

  it('should generate QR code from pairing info', async () => {
    const mockPairingInfo: PairingInfo = {
      token: 'test-token',
      url: 'http://192.168.1.100:3000/mobile?token=test-token',
      ip: '192.168.1.100',
      port: 3000,
    };

    apiService.getPairingInfo.mockReturnValue(of(mockPairingInfo));
    fixture.detectChanges();

    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(component.qrCodeDataUrl()).toBeTruthy();
    expect(component.qrCodeDataUrl()).toContain('data:image');
  });

  it('should handle errors when loading pairing info', (done) => {
    apiService.getPairingInfo.mockReturnValue(
      throwError(() => ({ status: 500, message: 'Server Error' }))
    );

    fixture.detectChanges();

    setTimeout(() => {
      expect(component.error()).toBe('Failed to load pairing information');
      expect(component.loading()).toBe(false);
      done();
    }, 100);
  });

  it('should refresh QR code when refreshQRCode is called', (done) => {
    const mockPairingInfo: PairingInfo = {
      token: 'new-token',
      url: 'http://192.168.1.100:3000/mobile?token=new-token',
      ip: '192.168.1.100',
      port: 3000,
    };

    apiService.getPairingInfo.mockReturnValue(of(mockPairingInfo));

    const triggerBefore = component['refreshTrigger']();
    component.refreshQRCode();
    const triggerAfter = component['refreshTrigger']();

    expect(triggerAfter).toBeGreaterThan(triggerBefore);
    done();
  });
});

