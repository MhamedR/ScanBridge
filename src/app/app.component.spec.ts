import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AppComponent } from './app.component';
import { QrCardComponent } from './components/qr-card/qr-card.component';
import { DeviceListComponent } from './components/device-list/device-list.component';
import { ScanPreviewComponent } from './components/scan-preview/scan-preview.component';
import { ApiService } from './services/api.service';
import { WebSocketService } from './services/websocket.service';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        QrCardComponent,
        DeviceListComponent,
        ScanPreviewComponent,
      ],
      imports: [
        MatToolbarModule,
      ],
      providers: [
        provideHttpClient(),
        provideNoopAnimations(),
        ApiService,
        WebSocketService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it(`should have as title 'ScanBridge'`, () => {
    expect(component.title).toEqual('ScanBridge');
  });

  it('should render title in toolbar', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('mat-toolbar span').textContent).toContain('ScanBridge');
  });

  it('should initialize without errors', () => {
    expect(() => {
      fixture.detectChanges();
    }).not.toThrow();
  });
});

