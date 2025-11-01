import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ApiService, Device, PairingInfo } from './api.service';
import { of } from 'rxjs';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ApiService,
      ],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPairingInfo', () => {
    it('should return pairing information', (done) => {
      const mockPairingInfo: PairingInfo = {
        token: 'test-token-123',
        url: 'http://192.168.1.100:3000/mobile?token=test-token-123',
        ip: '192.168.1.100',
        port: 3000,
      };

      service.getPairingInfo().subscribe({
        next: (result) => {
          expect(result).toEqual(mockPairingInfo);
          expect(result.token).toBe('test-token-123');
          expect(result.ip).toBe('192.168.1.100');
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne('http://localhost:3000/pairing');
      expect(req.request.method).toBe('GET');
      req.flush(mockPairingInfo);
    });

    it('should handle errors', (done) => {
      service.getPairingInfo().subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });

      const req = httpMock.expectOne('http://localhost:3000/pairing');
      req.flush(null, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getDevices', () => {
    it('should return list of devices', (done) => {
      const mockDevices: Device[] = [
        {
          id: 'device-1',
          name: 'iPhone 13',
          connectedAt: '2024-01-01T12:00:00Z',
        },
        {
          id: 'device-2',
          name: 'Samsung Galaxy',
          connectedAt: '2024-01-01T12:05:00Z',
        },
      ];

      service.getDevices().subscribe({
        next: (devices) => {
          expect(devices).toEqual(mockDevices);
          expect(devices.length).toBe(2);
          expect(devices[0].name).toBe('iPhone 13');
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne('http://localhost:3000/devices');
      expect(req.request.method).toBe('GET');
      req.flush(mockDevices);
    });

    it('should update devices signal', (done) => {
      const mockDevices: Device[] = [
        {
          id: 'device-1',
          name: 'Test Device',
          connectedAt: '2024-01-01T12:00:00Z',
        },
      ];

      service.getDevices().subscribe({
        next: () => {
          expect(service.devices()).toEqual(mockDevices);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne('http://localhost:3000/devices');
      req.flush(mockDevices);
    });
  });

  describe('sendScanCommand', () => {
    it('should send scan command to device', (done) => {
      const deviceId = 'device-123';
      const mockResponse = {
        success: true,
        message: 'Command sent',
      };

      service.sendScanCommand(deviceId).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(response.success).toBe(true);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`http://localhost:3000/command/${deviceId}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ type: 'scan' });
      req.flush(mockResponse);
    });

    it('should handle scan command errors', (done) => {
      const deviceId = 'device-123';

      service.sendScanCommand(deviceId).subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        },
      });

      const req = httpMock.expectOne(`http://localhost:3000/command/${deviceId}`);
      req.flush(null, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('refreshDevices', () => {
    it('should call getDevices', (done) => {
      const getDevicesSpy = jest.spyOn(service, 'getDevices').mockReturnValue(of([]));
      service.refreshDevices();

      // Wait for the request to be made
      setTimeout(() => {
        expect(getDevicesSpy).toHaveBeenCalled();
        getDevicesSpy.mockRestore();
        done();
      }, 10);
    });
  });
});

