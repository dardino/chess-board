import { beforeEach, describe, expect, it } from 'vitest';
import { ChessBoard } from '../src/ChessBoard';
import { ChessPiece } from '../src/ChessPiece';

describe('ChessBoard - Piece Rotation', () => {
  let board: ChessBoard;

  beforeEach(() => {
    board = new ChessBoard();
    document.body.appendChild(board);
    board.setFen('8/8/8/8/4N3/8/8/8 w - - 0 1'); // White knight on e4
    board.selectSquare('e4');
  });

  it('should rotate piece counter-clockwise with Alt+Left', () => {
    const square = board.shadowRoot!.querySelector('[data-coordinate="e4"]') as HTMLElement;
    const piece = square.querySelector('chess-piece') as ChessPiece;
    
    // Initial rotation should be 0
    expect(piece.getRotation()).toBe('0');
    
    // Simulate Alt+Left (Option on macOS)
    const event = new KeyboardEvent('keydown', { 
      key: 'ArrowLeft', 
      altKey: true,
      bubbles: true 
    });
    board.shadowRoot!.querySelector('.board')!.dispatchEvent(event);
    
    // Should rotate to 315° (counter-clockwise)
    expect(piece.getRotation()).toBe('315');
  });

  it('should rotate piece clockwise with Alt+Right', () => {
    const square = board.shadowRoot!.querySelector('[data-coordinate="e4"]') as HTMLElement;
    const piece = square.querySelector('chess-piece') as ChessPiece;
    
    expect(piece.getRotation()).toBe('0');
    
    // Simulate Alt+Right (Option on macOS)
    const event = new KeyboardEvent('keydown', { 
      key: 'ArrowRight', 
      altKey: true,
      bubbles: true 
    });
    board.shadowRoot!.querySelector('.board')!.dispatchEvent(event);
    
    // Should rotate to 45° (clockwise)
    expect(piece.getRotation()).toBe('45');
  });

  it('should reset rotation to 0° with Alt+Up', () => {
    const square = board.shadowRoot!.querySelector('[data-coordinate="e4"]') as HTMLElement;
    const piece = square.querySelector('chess-piece') as ChessPiece;
    
    // Set initial rotation to 135
    piece.setRotation('135');
    expect(piece.getRotation()).toBe('135');
    
    // Simulate Alt+Up (Option on macOS)
    const event = new KeyboardEvent('keydown', { 
      key: 'ArrowUp', 
      altKey: true,
      bubbles: true 
    });
    board.shadowRoot!.querySelector('.board')!.dispatchEvent(event);
    
    // Should reset to 0°
    expect(piece.getRotation()).toBe('0');
  });

  it('should set rotation to 180° with Alt+Down', () => {
    const square = board.shadowRoot!.querySelector('[data-coordinate="e4"]') as HTMLElement;
    const piece = square.querySelector('chess-piece') as ChessPiece;
    
    expect(piece.getRotation()).toBe('0');
    
    // Simulate Alt+Down (Option on macOS)
    const event = new KeyboardEvent('keydown', { 
      key: 'ArrowDown', 
      altKey: true,
      bubbles: true 
    });
    board.shadowRoot!.querySelector('.board')!.dispatchEvent(event);
    
    // Should set to 180°
    expect(piece.getRotation()).toBe('180');
  });

  it('should handle multiple rotations correctly', () => {
    const square = board.shadowRoot!.querySelector('[data-coordinate="e4"]') as HTMLElement;
    const piece = square.querySelector('chess-piece') as ChessPiece;
    
    const boardElement = board.shadowRoot!.querySelector('.board')!;
    
    // Rotate clockwise 45° three times
    for (let i = 0; i < 3; i++) {
      const event = new KeyboardEvent('keydown', { 
        key: 'ArrowRight', 
        altKey: true,
        bubbles: true 
      });
      boardElement.dispatchEvent(event);
    }
    
    // Should be at 135°
    expect(piece.getRotation()).toBe('135');
    
    // Rotate counter-clockwise once
    const eventLeft = new KeyboardEvent('keydown', { 
      key: 'ArrowLeft', 
      altKey: true,
      bubbles: true 
    });
    boardElement.dispatchEvent(eventLeft);
    
    // Should be at 90°
    expect(piece.getRotation()).toBe('90');
  });

  it('should wrap around from 315° to 0° when rotating clockwise', () => {
    const square = board.shadowRoot!.querySelector('[data-coordinate="e4"]') as HTMLElement;
    const piece = square.querySelector('chess-piece') as ChessPiece;
    
    piece.setRotation('315');
    
    const event = new KeyboardEvent('keydown', { 
      key: 'ArrowRight', 
      altKey: true,
      bubbles: true 
    });
    board.shadowRoot!.querySelector('.board')!.dispatchEvent(event);
    
    // Should wrap to 0°
    expect(piece.getRotation()).toBe('0');
  });

  it('should not rotate if no piece on current square', () => {
    board.selectSquare('a1'); // Empty square
    
    const event = new KeyboardEvent('keydown', { 
      key: 'ArrowRight', 
      altKey: true,
      bubbles: true 
    });
    
    // Should not throw error
    expect(() => {
      board.shadowRoot!.querySelector('.board')!.dispatchEvent(event);
    }).not.toThrow();
  });
});

describe('ChessBoard - Board Orientation', () => {
  let board: ChessBoard;

  beforeEach(() => {
    board = new ChessBoard();
    document.body.appendChild(board);
    board.setFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    board.selectSquare('e4');
  });

  it('should flip board to white perspective with Shift+Up', () => {
    // Set to black first
    board.setAttribute('black-to-move', '');
    expect(board.hasAttribute('black-to-move')).toBe(true);
    
    // Simulate Shift+Up
    const event = new KeyboardEvent('keydown', { 
      key: 'ArrowUp', 
      shiftKey: true,
      bubbles: true 
    });
    board.shadowRoot!.querySelector('.board')!.dispatchEvent(event);
    
    // Should be white perspective
    expect(board.hasAttribute('black-to-move')).toBe(false);
  });

  it('should flip board to black perspective with Shift+Down', () => {
    // Start with white perspective
    expect(board.hasAttribute('black-to-move')).toBe(false);
    
    // Simulate Shift+Down
    const event = new KeyboardEvent('keydown', { 
      key: 'ArrowDown', 
      shiftKey: true,
      bubbles: true 
    });
    board.shadowRoot!.querySelector('.board')!.dispatchEvent(event);
    
    // Should be black perspective
    expect(board.hasAttribute('black-to-move')).toBe(true);
  });

  it('should not navigate when using Shift+Arrow (board flip only)', () => {
    board.selectSquare('e4');
    
    // Simulate Shift+Up (should flip board, not navigate)
    const event = new KeyboardEvent('keydown', { 
      key: 'ArrowUp', 
      shiftKey: true,
      bubbles: true 
    });
    board.shadowRoot!.querySelector('.board')!.dispatchEvent(event);
    
    // Current square should still be e4
    expect(board.getCurrentSquare()).toBe('e4');
  });

  it('should not rotate piece when using Shift+Arrow (board flip only)', () => {
    board.setFen('8/8/8/8/4N3/8/8/8 w - - 0 1');
    board.selectSquare('e4');
    
    const square = board.shadowRoot!.querySelector('[data-coordinate="e4"]') as HTMLElement;
    const piece = square.querySelector('chess-piece') as ChessPiece;
    
    expect(piece.getRotation()).toBe('0');
    
    // Simulate Shift+Down (should flip board, not rotate piece)
    const event = new KeyboardEvent('keydown', { 
      key: 'ArrowDown', 
      shiftKey: true,
      bubbles: true 
    });
    board.shadowRoot!.querySelector('.board')!.dispatchEvent(event);
    
    // Piece rotation should still be 0
    expect(piece.getRotation()).toBe('0');
  });
});

describe('ChessBoard - Piece Selection and Move', () => {
  let board: ChessBoard;

  beforeEach(() => {
    board = new ChessBoard();
    document.body.appendChild(board);
    board.setFen('8/8/8/8/4N3/8/8/8 w - - 0 1');
    board.selectSquare('e4');
  });

  it('should toggle selection with Space on an occupied square', () => {
    const boardElement = board.shadowRoot!.querySelector('.board')!;
    const square = board.shadowRoot!.querySelector('[data-coordinate="e4"]') as HTMLElement;

    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
    boardElement.dispatchEvent(event);

    expect(square.classList.contains('selected-piece')).toBe(true);
    expect(board.getSelectedPieceSquare()).toBe('e4');

    const secondEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
    boardElement.dispatchEvent(secondEvent);

    expect(square.classList.contains('selected-piece')).toBe(false);
    expect(board.getSelectedPieceSquare()).toBeNull();
  });

  it('should move the selected piece to an empty square with Space and reset selection', () => {
    const boardElement = board.shadowRoot!.querySelector('.board')!;
    const square = board.shadowRoot!.querySelector('[data-coordinate="e4"]') as HTMLElement;

    const selectEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
    boardElement.dispatchEvent(selectEvent);

    const destination = board.shadowRoot!.querySelector('[data-coordinate="d4"]') as HTMLElement;
    board.selectSquare('d4');

    const moveEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
    boardElement.dispatchEvent(moveEvent);

    expect(board.getPieceAt('d4')).not.toBeNull();
    expect(board.getPieceAt('e4')).toBeNull();
    expect(square.classList.contains('selected-piece')).toBe(false);
    expect(destination.classList.contains('selected-piece')).toBe(false);
    expect(board.getSelectedPieceSquare()).toBeNull();
  });

  it('should clear selection on Escape and on blur', () => {
    const boardElement = board.shadowRoot!.querySelector('.board')!;
    const square = board.shadowRoot!.querySelector('[data-coordinate="e4"]') as HTMLElement;

    boardElement.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(square.classList.contains('selected-piece')).toBe(true);

    boardElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(board.getSelectedPieceSquare()).toBeNull();
    expect(square.classList.contains('selected-piece')).toBe(false);

    boardElement.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(board.getSelectedPieceSquare()).toBe('e4');

    boardElement.dispatchEvent(new FocusEvent('blur'));
    expect(board.getSelectedPieceSquare()).toBeNull();
  });
});

describe('ChessBoard - Keyboard Modifier Conflicts', () => {
  let board: ChessBoard;

  beforeEach(() => {
    board = new ChessBoard();
    document.body.appendChild(board);
    board.setFen('8/8/8/8/4N3/8/8/8 w - - 0 1');
    board.selectSquare('e4');
  });

  it('should prioritize Alt+Arrow over regular Arrow', () => {
    const square = board.shadowRoot!.querySelector('[data-coordinate="e4"]') as HTMLElement;
    const piece = square.querySelector('chess-piece') as ChessPiece;
    
    // Alt+Right should rotate, not navigate
    const event = new KeyboardEvent('keydown', { 
      key: 'ArrowRight', 
      altKey: true,
      bubbles: true 
    });
    board.shadowRoot!.querySelector('.board')!.dispatchEvent(event);
    
    // Piece should be rotated
    expect(piece.getRotation()).toBe('45');
    
    // Current square should still be e4 (no navigation)
    expect(board.getCurrentSquare()).toBe('e4');
  });

  it('should prioritize Shift+Arrow over regular Arrow', () => {
    const initialOrientation = board.hasAttribute('black-to-move');
    
    // Shift+Down should flip board, not navigate
    const event = new KeyboardEvent('keydown', { 
      key: 'ArrowDown', 
      shiftKey: true,
      bubbles: true 
    });
    board.shadowRoot!.querySelector('.board')!.dispatchEvent(event);
    
    // Board orientation should change
    expect(board.hasAttribute('black-to-move')).toBe(!initialOrientation);
    
    // Current square should still be e4 (no navigation)
    expect(board.getCurrentSquare()).toBe('e4');
  });

  it('should not trigger piece rotation with Shift+Alt+Arrow', () => {
    const square = board.shadowRoot!.querySelector('[data-coordinate="e4"]') as HTMLElement;
    const piece = square.querySelector('chess-piece') as ChessPiece;
    
    // Shift+Alt+Right should not rotate (both modifiers)
    const event = new KeyboardEvent('keydown', { 
      key: 'ArrowRight', 
      altKey: true,
      shiftKey: true,
      bubbles: true 
    });
    board.shadowRoot!.querySelector('.board')!.dispatchEvent(event);
    
    // Piece should NOT be rotated
    expect(piece.getRotation()).toBe('0');
  });
});
