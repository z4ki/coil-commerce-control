import '@testing-library/jest-dom';

// Mock TextEncoder/TextDecoder which is required by react-router-dom
if (typeof globalThis.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
}
import 'jest-environment-jsdom';

// Mock TextEncoder/TextDecoder which is required by react-router-dom
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;
