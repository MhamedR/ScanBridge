import { TestBed } from '@angular/core/testing';
import { WebSocketService, ScanCompleteEvent } from './websocket.service';

describe('WebSocketService', () => {
  let service: WebSocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WebSocketService],
    });
    service = TestBed.inject(WebSocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('scanComplete$', () => {
    it('should emit scan complete events', (done) => {
      const mockEvent: ScanCompleteEvent = {
        fileName: 'scan_123.jpg',
        path: '/Users/test/Desktop/scan_123.jpg',
        deviceId: 'device-1',
      };

      service.scanComplete$.subscribe({
        next: (event) => {
          expect(event).toEqual(mockEvent);
          expect(event.fileName).toBe('scan_123.jpg');
          done();
        },
        error: done.fail,
      });

      service.notifyScanComplete(mockEvent);
    });

    it('should handle multiple subscribers', (done) => {
      const mockEvent: ScanCompleteEvent = {
        fileName: 'scan_456.jpg',
        path: '/Users/test/Desktop/scan_456.jpg',
        deviceId: 'device-2',
      };

      let callCount = 0;
      const checkComplete = () => {
        callCount++;
        if (callCount === 2) {
          done();
        }
      };

      service.scanComplete$.subscribe({
        next: (event) => {
          expect(event).toEqual(mockEvent);
          checkComplete();
        },
        error: done.fail,
      });

      service.scanComplete$.subscribe({
        next: (event) => {
          expect(event).toEqual(mockEvent);
          checkComplete();
        },
        error: done.fail,
      });

      service.notifyScanComplete(mockEvent);
    });
  });

  describe('notifyScanComplete', () => {
    it('should notify all subscribers', (done) => {
      const events: ScanCompleteEvent[] = [];
      service.scanComplete$.subscribe({
        next: (event) => {
          events.push(event);
          if (events.length === 2) {
            expect(events).toHaveLength(2);
            expect(events[0].fileName).toBe('scan1.jpg');
            expect(events[1].fileName).toBe('scan2.jpg');
            done();
          }
        },
        error: done.fail,
      });

      service.notifyScanComplete({
        fileName: 'scan1.jpg',
        path: '/path1',
        deviceId: 'device-1',
      });

      service.notifyScanComplete({
        fileName: 'scan2.jpg',
        path: '/path2',
        deviceId: 'device-2',
      });
    });
  });
});

