// Test setup file
// This file is executed before running tests

// Import any global test setup here
// For example: custom matchers, global mocks, etc.

// Example: Custom element registration for web components
import { ChessBoard } from '../src/ChessBoard/ChessBoard';

// Register the web component globally for tests
if (!customElements.get('chess-board')) {
  customElements.define('chess-board', ChessBoard);
}
