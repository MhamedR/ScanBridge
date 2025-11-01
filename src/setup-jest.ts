// Import jest-preset-angular after Buffer is set up
// @ts-ignore - jest-preset-angular import
import 'jest-preset-angular';
// Import zone.js for Angular v20
import 'zone.js';
import { TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());

// Mock Electron window.require
Object.defineProperty(window, 'require', {
  value: jest.fn(() => ({
    ipcRenderer: {
      on: jest.fn(),
      send: jest.fn(),
      removeAllListeners: jest.fn(),
    },
  })),
  writable: true,
});

// Suppress console errors in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};

