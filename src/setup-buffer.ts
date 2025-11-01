// Critical: Buffer polyfill must be set up before jest-preset-angular imports esbuild
// @ts-nocheck - Skip type checking for this polyfill file
import { Buffer } from 'buffer';

// Set Buffer globally
(globalThis as any).Buffer = Buffer;
(global as any).Buffer = Buffer;

// Fix Buffer.prototype chain for esbuild compatibility
// This ensures Buffer.from('') instanceof Uint8Array returns true
Object.setPrototypeOf(Buffer.prototype, Uint8Array.prototype);
