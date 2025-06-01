import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Set up TextEncoder/TextDecoder for tests
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// import '@testing-library/jest-dom';
// import { TextEncoder, TextDecoder } from 'util';

// // Polyfill for TextEncoder and TextDecoder
// if (typeof global.TextEncoder === 'undefined') {
//   global.TextEncoder = TextEncoder;
// }
// if (typeof global.TextDecoder === 'undefined') {
//   // @ts-ignore
//   global.TextDecoder = TextDecoder;
// }

// // Mock ResizeObserver (already present in your file)
// if (typeof global.ResizeObserver === 'undefined') {
//   global.ResizeObserver = class ResizeObserver {
//     observe() {}
//     unobserve() {}
//     disconnect() {}
//   };
// }
