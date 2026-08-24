import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ChessPiece } from '../src';
import { ChessBoard, type CellClickEventDetail } from '../src/ChessBoard';

describe('ChessBoard Web Component', () => {
  let element: ChessBoard;

  beforeEach(() => {
    // Create a new instance for each test
    element = new ChessBoard();
    // Append to document to trigger connectedCallback
    document.body.appendChild(element);
  });

  afterEach(() => {
    // Clean up after each test
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });

  it('should be an instance of HTMLElement', () => {
    expect(element).toBeInstanceOf(HTMLElement);
  });

  it('should have shadow root', () => {
    expect(element.shadowRoot).toBeDefined();
  });

  it('should create chess board with 64 squares and labels', () => {
    const squares = element.shadowRoot?.querySelectorAll('.square');
    expect(squares).toHaveLength(64);

    const topLabels = element.shadowRoot?.querySelectorAll('.top-labels .column-label');
    expect(topLabels).toHaveLength(8);

    const bottomLabels = element.shadowRoot?.querySelectorAll('.bottom-labels .column-label');
    expect(bottomLabels).toHaveLength(8);

    const leftLabels = element.shadowRoot?.querySelectorAll('.left-labels .row-label');
    expect(leftLabels).toHaveLength(8);

    const rightLabels = element.shadowRoot?.querySelectorAll('.right-labels .row-label');
    expect(rightLabels).toHaveLength(8);
  });

  it('should have alternating square colors', () => {
    const squares = element.shadowRoot?.querySelectorAll('.square') as NodeListOf<HTMLElement>;
    expect(squares?.[0]?.classList.contains('light')).toBe(true); // First square should be light
    expect(squares?.[1]?.classList.contains('dark')).toBe(true); // Second square should be dark
  });  it('should have board with correct class', () => {
    const board = element.shadowRoot?.querySelector('.board') as HTMLElement;
    expect(board).toBeTruthy();
    expect(board?.className).toBe('board');
  });

  it('should have white rook in bottom-left corner', () => {
    const squares = element.shadowRoot?.querySelectorAll('.square');
    const piece = squares?.[56]?.querySelector('.piece');
    expect(piece).toBeNull(); // No piece in bottom-left corner (a1) by default
  });

  it('should have black king in top center', () => {
    const squares = element.shadowRoot?.querySelectorAll('.square');
    const piece = squares?.[4]?.querySelector('.piece');
    expect(piece).toBeNull(); // No piece in top center (e8) by default
  });

  it('should have white pawns on second-to-last row', () => {
    const squares = element.shadowRoot?.querySelectorAll('.square');
    for (let col = 0; col < 8; col++) {
      const squareIndex = 48 + col; // Second-to-last row
      const piece = squares?.[squareIndex]?.querySelector('.piece');
      expect(piece).toBeNull(); // No pieces on second-to-last row by default
    }
  });

  it('should have black pawns on second row', () => {
    const squares = element.shadowRoot?.querySelectorAll('.square');
    for (let col = 0; col < 8; col++) {
      const squareIndex = 8 + col; // Second row
      const piece = squares?.[squareIndex]?.querySelector('.piece');
      expect(piece).toBeNull(); // No pieces on second row by default
    }
  });

  it('should have column labels (a-h) in top and bottom rows', () => {
    const topLabels = element.shadowRoot?.querySelectorAll('.top-labels .column-label');
    const bottomLabels = element.shadowRoot?.querySelectorAll('.bottom-labels .column-label');

    const expectedLabels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    // Check top row labels
    topLabels?.forEach((label, index) => {
      expect(label.textContent).toBe(expectedLabels[index]);
    });

    // Check bottom row labels (same order)
    bottomLabels?.forEach((label, index) => {
      expect(label.textContent).toBe(expectedLabels[index]);
    });
  });

  it('should have row labels (8-1) in left and right columns', () => {
    const leftLabels = element.shadowRoot?.querySelectorAll('.left-labels .row-label');
    const rightLabels = element.shadowRoot?.querySelectorAll('.right-labels .row-label');

    const expectedRowLabels = ['8', '7', '6', '5', '4', '3', '2', '1'];

    // Check left column labels
    leftLabels?.forEach((label, index) => {
      expect(label.textContent).toBe(expectedRowLabels[index]);
    });

    // Check right column labels (same order)
    rightLabels?.forEach((label, index) => {
      expect(label.textContent).toBe(expectedRowLabels[index]);
    });
  });

  it('should show labels by default when hide-labels attribute is not present', () => {
    // Ensure no hide-labels attribute
    element.removeAttribute('hide-labels');

    // Check that label sections exist and are not hidden
    const topLabels = element.shadowRoot?.querySelector('.top-labels');
    const leftLabels = element.shadowRoot?.querySelector('.left-labels');
    const rightLabels = element.shadowRoot?.querySelector('.right-labels');
    const bottomLabels = element.shadowRoot?.querySelector('.bottom-labels');

    expect(topLabels).toBeTruthy();
    expect(leftLabels).toBeTruthy();
    expect(rightLabels).toBeTruthy();
    expect(bottomLabels).toBeTruthy();
  });

  it('should hide labels when hide-labels attribute is present', () => {
    // Add hide-labels attribute
    element.setAttribute('hide-labels', '');

    // Check that the attribute is present
    expect(element.hasAttribute('hide-labels')).toBe(true);

    // Check that label sections still exist in DOM (CSS will hide them visually)
    const topLabels = element.shadowRoot?.querySelector('.top-labels');
    const leftLabels = element.shadowRoot?.querySelector('.left-labels');
    const rightLabels = element.shadowRoot?.querySelector('.right-labels');
    const bottomLabels = element.shadowRoot?.querySelector('.bottom-labels');

    expect(topLabels).toBeTruthy();
    expect(leftLabels).toBeTruthy();
    expect(rightLabels).toBeTruthy();
    expect(bottomLabels).toBeTruthy();

    // Check that board is still present
    const board = element.shadowRoot?.querySelector('.board');
    expect(board).toBeTruthy();
  });

  it('should have correct data-coordinate attributes on squares', () => {
    const squares = element.shadowRoot?.querySelectorAll('.square') as NodeListOf<HTMLElement>;

    // Test corner squares
    expect(squares?.[0]?.getAttribute('data-coordinate')).toBe('a8'); // Top-left
    expect(squares?.[7]?.getAttribute('data-coordinate')).toBe('h8'); // Top-right
    expect(squares?.[56]?.getAttribute('data-coordinate')).toBe('a1'); // Bottom-left
    expect(squares?.[63]?.getAttribute('data-coordinate')).toBe('h1'); // Bottom-right

    // Test center squares
    expect(squares?.[35]?.getAttribute('data-coordinate')).toBe('d4'); // Center
    expect(squares?.[36]?.getAttribute('data-coordinate')).toBe('e4'); // Next to center

    // Test that squares are empty (no pieces)
    const e8Square = element.shadowRoot?.querySelector('[data-coordinate="e8"]');
    expect(e8Square).toBeTruthy();
    expect(e8Square?.querySelector('.piece')).toBeNull(); // No piece in e8

    const e1Square = element.shadowRoot?.querySelector('[data-coordinate="e1"]');
    expect(e1Square).toBeTruthy();
    expect(e1Square?.querySelector('.piece')).toBeNull(); // No piece in e1
  });

  it('should be registered as custom element', () => {
    expect(customElements.get('chess-board')).toBeDefined();
  });
});

describe('ChessBoard FEN support', () => {
  let element: ChessBoard;

  beforeEach(() => {
    // Create a new instance for each test
    element = new ChessBoard();
    // Append to document to trigger connectedCallback
    document.body.appendChild(element);
  });

  afterEach(() => {
    // Clean up after each test
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });

  it('should accept fen attribute', () => {
    element.setAttribute('fen', '8/8/8/8/8/8/8/8 w - - 0 1');
    expect(element.getFen()).toBe('8/8/8/8/8/8/8/8 w - - 0 1');
  });

  it('should place pieces from FEN string', () => {
    // Place a white king on e1
    element.setAttribute('fen', '8/8/8/8/8/8/8/4K3 w - - 0 1');

    const e1Square = element.shadowRoot?.querySelector('[data-coordinate="e1"]');
    const piece = e1Square?.querySelector('.piece');

    expect(piece).not.toBeNull();
    expect(piece?.getAttribute('piece')).toBe('k');
    expect(piece?.getAttribute('color')).toBe('w');
  });

  it('should place starting position pieces', () => {
    element.setAttribute('fen', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

    // Check white king
    const e1Square = element.shadowRoot?.querySelector('[data-coordinate="e1"]');
    const whiteKing = e1Square?.querySelector('.piece');
    expect(whiteKing?.getAttribute('piece')).toBe('k');
    expect(whiteKing?.getAttribute('color')).toBe('w');

    // Check black king
    const e8Square = element.shadowRoot?.querySelector('[data-coordinate="e8"]');
    const blackKing = e8Square?.querySelector('.piece');
    expect(blackKing?.getAttribute('piece')).toBe('k');
    expect(blackKing?.getAttribute('color')).toBe('b');

    // Check white rook
    const a1Square = element.shadowRoot?.querySelector('[data-coordinate="a1"]');
    const whiteRook = a1Square?.querySelector('.piece');
    expect(whiteRook?.getAttribute('piece')).toBe('r');
    expect(whiteRook?.getAttribute('color')).toBe('w');
  });

  it('should clear pieces when setting empty FEN', () => {
    // First set starting position
    element.setAttribute('fen', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

    // Then clear
    element.setAttribute('fen', '8/8/8/8/8/8/8/8 w - - 0 1');

    const squares = element.shadowRoot?.querySelectorAll('.square');
    squares?.forEach(square => {
      const piece = square.querySelector('.piece');
      expect(piece).toBeNull();
    });
  });

  it('should handle invalid FEN gracefully', () => {
    // Set invalid FEN
    element.setAttribute('fen', 'invalid-fen');

    // Should not crash and should clear any existing pieces
    const squares = element.shadowRoot?.querySelectorAll('.square');
    squares?.forEach(square => {
      const piece = square.querySelector('.piece');
      expect(piece).toBeNull();
    });
  });

  it('should support setFen method', () => {
    element.setFen('8/8/8/8/8/8/8/4K3 w - - 0 1');

    const e1Square = element.shadowRoot?.querySelector('[data-coordinate="e1"]');
    const piece = e1Square?.querySelector('.piece') as ChessPiece | null;
    piece?.setFairyName('GRA');
    piece?.setFairyCondition('Imitator');

    expect(piece).not.toBeNull();
    expect(piece?.getAttribute('piece')).toBe('k');
    expect(piece?.getAttribute('color')).toBe('w');
    expect(element.getFen()).toContain('e1:');
  });

  it('should support setStartingPosition method', () => {
    element.setStartingPosition();

    // Check that pieces are placed
    const e1Square = element.shadowRoot?.querySelector('[data-coordinate="e1"]');
    const whiteKing = e1Square?.querySelector('.piece');
    expect(whiteKing?.getAttribute('piece')).toBe('k');
    expect(whiteKing?.getAttribute('color')).toBe('w');
  });

  it('should support clearBoard method', () => {
    // First set some pieces
    element.setFen('8/8/8/8/8/8/8/4K3 w - - 0 1');

    // Then clear
    element.clearBoard();

    const squares = element.shadowRoot?.querySelectorAll('.square');
    squares?.forEach(square => {
      const piece = square.querySelector('.piece');
      expect(piece).toBeNull();
    });
  });

  it('should dispatch cellClick event when square is clicked', () => {
    let eventDetail: CellClickEventDetail | null = null;
    const eventHandler = (event: CustomEvent<CellClickEventDetail>) => {
      eventDetail = event.detail;
    };

    element.addEventListener('cellClick', eventHandler);

    // Click on e4 square
    const e4Square = element.shadowRoot?.querySelector('[data-coordinate="e4"]') as HTMLElement;
    e4Square?.click();

    expect(eventDetail).toBeDefined();
    expect(eventDetail!.square).toBe('e4');
    expect(eventDetail!.piece).toBeUndefined(); // Empty square

    element.removeEventListener('cellClick', eventHandler);
  });

  it('should dispatch cellClick event with piece info when square with piece is clicked', () => {
    // Set up a position with a piece on e4
    element.setFen('8/8/8/8/4P3/8/8/8 w - - 0 1');

    let eventDetail: CellClickEventDetail | null = null;
    const eventHandler = (event: CustomEvent<CellClickEventDetail>) => {
      eventDetail = event.detail;
    };

    element.addEventListener('cellClick', eventHandler);

    // Click on e4 square (should have a white pawn)
    const e4Square = element.shadowRoot?.querySelector('[data-coordinate="e4"]') as HTMLElement;
    e4Square?.click();

    expect(eventDetail).toBeDefined();
    expect(eventDetail!.square).toBe('e4');
    expect(eventDetail!.piece).toBeDefined();
    expect(eventDetail!.piece!.color).toBe('w');
    expect(eventDetail!.piece!.type).toBe('p');

    element.removeEventListener('cellClick', eventHandler);
  });

  it('should dispatch cellClick event with rotation and fairy data when present', () => {
    // Set up a position with a piece on e4
    element.setFen('8/8/8/8/4P3/8/8/8 w - - 0 1');

    // Add rotation and fairy data to the piece
    const e4Square = element.shadowRoot?.querySelector('[data-coordinate="e4"]') as HTMLElement;
    const piece = e4Square?.querySelector('chess-piece');
    
    if (piece) {
      piece.setAttribute('rotation', '90');
      piece.setAttribute('fairy-name', 'GRA');
      piece.setAttribute('fairy-condition', '=');
    }

    let eventDetail: CellClickEventDetail | null = null;
    const eventHandler = (event: CustomEvent<CellClickEventDetail>) => {
      eventDetail = event.detail;
    };

    element.addEventListener('cellClick', eventHandler);

    // Click on e4 square
    e4Square?.click();

    expect(eventDetail).toBeDefined();
    expect(eventDetail!.square).toBe('e4');
    expect(eventDetail!.piece).toBeDefined();
    expect(eventDetail!.piece!.color).toBe('w');
    expect(eventDetail!.piece!.type).toBe('p');
    expect(eventDetail!.piece!.rotation).toBe('90');
    expect(eventDetail!.piece!.fairyName).toBe('GRA');
    expect(eventDetail!.piece!.fairyCondition).toBe('=');

    element.removeEventListener('cellClick', eventHandler);
  });

  it('should dispatch cellClick event with neutral color', () => {
    // Manually create a neutral piece on e4
    const e4Square = element.shadowRoot?.querySelector('[data-coordinate="e4"]') as HTMLElement;
    
    // Create a neutral empress piece
    const piece = document.createElement('chess-piece');
    piece.setAttribute('piece', 'e');
    piece.setAttribute('color', 'n');
    piece.classList.add('piece');
    e4Square?.appendChild(piece);

    let eventDetail: CellClickEventDetail | null = null;
    const eventHandler = (event: CustomEvent<CellClickEventDetail>) => {
      eventDetail = event.detail;
    };

    element.addEventListener('cellClick', eventHandler);

    // Click on e4 square
    e4Square?.click();

    expect(eventDetail).toBeDefined();
    expect(eventDetail!.square).toBe('e4');
    expect(eventDetail!.piece).toBeDefined();
    expect(eventDetail!.piece!.color).toBe('n');
    expect(eventDetail!.piece!.type).toBe('e');

    element.removeEventListener('cellClick', eventHandler);
  });

  it('should not include rotation and fairy data when not present', () => {
    // Set up a position with a piece on e4 (no rotation or fairy data)
    element.setFen('8/8/8/8/4P3/8/8/8 w - - 0 1');

    let eventDetail: CellClickEventDetail | null = null;
    const eventHandler = (event: CustomEvent<CellClickEventDetail>) => {
      eventDetail = event.detail;
    };

    element.addEventListener('cellClick', eventHandler);

    // Click on e4 square
    const e4Square = element.shadowRoot?.querySelector('[data-coordinate="e4"]') as HTMLElement;
    e4Square?.click();

    expect(eventDetail).toBeDefined();
    expect(eventDetail!.square).toBe('e4');
    expect(eventDetail!.piece).toBeDefined();
    expect(eventDetail!.piece!.color).toBe('w');
    expect(eventDetail!.piece!.type).toBe('p');
    expect(eventDetail!.piece!.rotation).toBeUndefined();
    expect(eventDetail!.piece!.fairyName).toBeUndefined();
    expect(eventDetail!.piece!.fairyCondition).toBeUndefined();

    element.removeEventListener('cellClick', eventHandler);
  });
});

describe('ChessBoard Keyboard Handlers', () => {
  let element: ChessBoard;

  beforeEach(() => {
    element = new ChessBoard();
    document.body.appendChild(element);
  });

  afterEach(() => {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });

  it('should remove piece from current square when Delete key is pressed', () => {
    // Set up a position with a piece on e4
    element.setFen('8/8/8/8/4P3/8/8/8 w - - 0 1');
    
    // Select e4 square
    element.selectSquare('e4');

    // Get the board element and trigger Delete key
    const board = element.shadowRoot?.querySelector('.board') as HTMLElement;
    const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete' });
    board.dispatchEvent(deleteEvent);

    // Verify piece was removed
    const e4Square = element.shadowRoot?.querySelector('[data-coordinate="e4"]') as HTMLElement;
    const piece = e4Square?.querySelector('chess-piece');
    expect(piece).toBeNull();
  });

  it('should clear board when Escape key is pressed', () => {
    // Set up starting position
    element.setStartingPosition();

    // Select a square
    element.selectSquare('e4');

    // Verify pieces exist
    const e1Square = element.shadowRoot?.querySelector('[data-coordinate="e1"]') as HTMLElement;
    expect(e1Square?.querySelector('chess-piece')).toBeTruthy();

    // Get the board element and trigger Escape key
    const board = element.shadowRoot?.querySelector('.board') as HTMLElement;
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    board.dispatchEvent(escapeEvent);

    // Verify all pieces were removed
    const squares = element.shadowRoot?.querySelectorAll('.square');
    squares?.forEach(square => {
      expect(square.querySelector('chess-piece')).toBeNull();
    });
  });

  it('should set starting position when Shift+Escape is pressed', () => {
    // Start with empty board
    element.clearBoard();

    // Verify board is empty
    let e1Square = element.shadowRoot?.querySelector('[data-coordinate="e1"]') as HTMLElement;
    expect(e1Square?.querySelector('chess-piece')).toBeNull();

    // Select a square
    element.selectSquare('e4');

    // Get the board element and trigger Shift+Escape
    const board = element.shadowRoot?.querySelector('.board') as HTMLElement;
    const shiftEscapeEvent = new KeyboardEvent('keydown', { 
      key: 'Escape', 
      shiftKey: true 
    });
    board.dispatchEvent(shiftEscapeEvent);

    // Verify starting position is set
    e1Square = element.shadowRoot?.querySelector('[data-coordinate="e1"]') as HTMLElement;
    const whiteKing = e1Square?.querySelector('chess-piece');
    expect(whiteKing?.getAttribute('piece')).toBe('k');
    expect(whiteKing?.getAttribute('color')).toBe('w');

    const e8Square = element.shadowRoot?.querySelector('[data-coordinate="e8"]') as HTMLElement;
    const blackKing = e8Square?.querySelector('chess-piece');
    expect(blackKing?.getAttribute('piece')).toBe('k');
    expect(blackKing?.getAttribute('color')).toBe('b');
  });

  it('should select and move a piece when Enter is pressed', () => {
    element.setFen('8/8/8/8/4P3/8/8/8 w - - 0 1');
    element.selectSquare('e4');

    const board = element.shadowRoot?.querySelector('.board') as HTMLElement;
    board.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    board.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    board.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    const e4Square = element.shadowRoot?.querySelector('[data-coordinate="e4"]') as HTMLElement;
    const f4Square = element.shadowRoot?.querySelector('[data-coordinate="f4"]') as HTMLElement;

    expect(e4Square.querySelector('chess-piece')).toBeNull();
    expect(f4Square.querySelector('chess-piece')?.getAttribute('piece')).toBe('p');
    expect(f4Square.querySelector('chess-piece')?.getAttribute('color')).toBe('w');
  });

  it('should not remove piece when Delete is pressed without current square', () => {
    // Set up a position with pieces
    element.setFen('8/8/8/8/4P3/8/8/8 w - - 0 1');

    // Don't select any square (currentSquare is null)
    
    // Get the board element and trigger Delete key
    const board = element.shadowRoot?.querySelector('.board') as HTMLElement;
    const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete' });
    board.dispatchEvent(deleteEvent);

    // Verify piece still exists
    const e4Square = element.shadowRoot?.querySelector('[data-coordinate="e4"]') as HTMLElement;
    const piece = e4Square?.querySelector('chess-piece');
    expect(piece).toBeTruthy();
  });

  it('should not crash when Delete is pressed on empty square', () => {
    // Set up empty board
    element.clearBoard();
    
    // Select e4 square (empty)
    element.selectSquare('e4');

    // Get the board element and trigger Delete key
    const board = element.shadowRoot?.querySelector('.board') as HTMLElement;
    const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete' });
    
    // Should not throw
    expect(() => board.dispatchEvent(deleteEvent)).not.toThrow();

    // Verify square is still empty
    const e4Square = element.shadowRoot?.querySelector('[data-coordinate="e4"]') as HTMLElement;
    expect(e4Square?.querySelector('chess-piece')).toBeNull();
  });

  describe('Piece Key Handlers', () => {
    it('should add white pawn when P key is pressed', () => {
      // Start with empty board
      element.clearBoard();
      
      // Select e4 square
      element.selectSquare('e4');

      // Press P key (uppercase = white)
      const board = element.shadowRoot?.querySelector('.board') as HTMLElement;
      const pKeyEvent = new KeyboardEvent('keydown', { key: 'P' });
      board.dispatchEvent(pKeyEvent);

      // Verify white pawn was added
      const e4Square = element.shadowRoot?.querySelector('[data-coordinate="e4"]') as HTMLElement;
      const piece = e4Square?.querySelector('chess-piece');
      expect(piece?.getAttribute('piece')).toBe('p');
      expect(piece?.getAttribute('color')).toBe('w');
    });

    it('should add black pawn when p key is pressed', () => {
      // Start with empty board
      element.clearBoard();
      
      // Select e4 square
      element.selectSquare('e4');

      // Press p key (lowercase = black)
      const board = element.shadowRoot?.querySelector('.board') as HTMLElement;
      const pKeyEvent = new KeyboardEvent('keydown', { key: 'p' });
      board.dispatchEvent(pKeyEvent);

      // Verify black pawn was added
      const e4Square = element.shadowRoot?.querySelector('[data-coordinate="e4"]') as HTMLElement;
      const piece = e4Square?.querySelector('chess-piece');
      expect(piece?.getAttribute('piece')).toBe('p');
      expect(piece?.getAttribute('color')).toBe('b');
    });

    it('should add all standard white pieces with uppercase keys', () => {
      element.clearBoard();
      
      const pieces = [
        { key: 'K', type: 'k', square: 'e1' },
        { key: 'Q', type: 'q', square: 'd1' },
        { key: 'R', type: 'r', square: 'a1' },
        { key: 'B', type: 'b', square: 'c1' },
        { key: 'N', type: 'n', square: 'b1' },
        { key: 'P', type: 'p', square: 'e2' }
      ];

      const board = element.shadowRoot?.querySelector('.board') as HTMLElement;

      pieces.forEach(({ key, type, square }) => {
        element.selectSquare(square);
        const keyEvent = new KeyboardEvent('keydown', { key });
        board.dispatchEvent(keyEvent);

        const squareElement = element.shadowRoot?.querySelector(`[data-coordinate="${square}"]`) as HTMLElement;
        const piece = squareElement?.querySelector('chess-piece');
        expect(piece?.getAttribute('piece')).toBe(type);
        expect(piece?.getAttribute('color')).toBe('w');
      });
    });

    it('should add all standard black pieces with lowercase keys', () => {
      element.clearBoard();
      
      const pieces = [
        { key: 'k', type: 'k', square: 'e8' },
        { key: 'q', type: 'q', square: 'd8' },
        { key: 'r', type: 'r', square: 'a8' },
        { key: 'b', type: 'b', square: 'c8' },
        { key: 'n', type: 'n', square: 'b8' },
        { key: 'p', type: 'p', square: 'e7' }
      ];

      const board = element.shadowRoot?.querySelector('.board') as HTMLElement;

      pieces.forEach(({ key, type, square }) => {
        element.selectSquare(square);
        const keyEvent = new KeyboardEvent('keydown', { key });
        board.dispatchEvent(keyEvent);

        const squareElement = element.shadowRoot?.querySelector(`[data-coordinate="${square}"]`) as HTMLElement;
        const piece = squareElement?.querySelector('chess-piece');
        expect(piece?.getAttribute('piece')).toBe(type);
        expect(piece?.getAttribute('color')).toBe('b');
      });
    });

    it('should add fairy pieces with uppercase keys', () => {
      element.clearBoard();
      
      const fairyPieces = [
        { key: 'E', type: 'e', square: 'd4' }, // Empress
        { key: 'T', type: 't', square: 'e4' }, // Dragon
        { key: 'A', type: 'a', square: 'f4' }  // Angel/Archbishop
      ];

      const board = element.shadowRoot?.querySelector('.board') as HTMLElement;

      fairyPieces.forEach(({ key, type, square }) => {
        element.selectSquare(square);
        const keyEvent = new KeyboardEvent('keydown', { key });
        board.dispatchEvent(keyEvent);

        const squareElement = element.shadowRoot?.querySelector(`[data-coordinate="${square}"]`) as HTMLElement;
        const piece = squareElement?.querySelector('chess-piece');
        expect(piece?.getAttribute('piece')).toBe(type);
        expect(piece?.getAttribute('color')).toBe('w');
      });
    });

    it('should replace existing piece when key is pressed', () => {
      // Start with white pawn on e4
      element.setFen('8/8/8/8/4P3/8/8/8 w - - 0 1');
      
      // Select e4 square
      element.selectSquare('e4');

      // Press Q key to replace pawn with queen
      const board = element.shadowRoot?.querySelector('.board') as HTMLElement;
      const qKeyEvent = new KeyboardEvent('keydown', { key: 'Q' });
      board.dispatchEvent(qKeyEvent);

      // Verify queen replaced pawn
      const e4Square = element.shadowRoot?.querySelector('[data-coordinate="e4"]') as HTMLElement;
      const piece = e4Square?.querySelector('chess-piece');
      expect(piece?.getAttribute('piece')).toBe('q');
      expect(piece?.getAttribute('color')).toBe('w');

      // Verify only one piece element exists
      const pieces = e4Square?.querySelectorAll('chess-piece');
      expect(pieces?.length).toBe(1);
    });

    it('should not add piece when no current square is selected', () => {
      // Start with empty board
      element.clearBoard();

      // Don't select any square

      // Press P key
      const board = element.shadowRoot?.querySelector('.board') as HTMLElement;
      const pKeyEvent = new KeyboardEvent('keydown', { key: 'P' });
      board.dispatchEvent(pKeyEvent);

      // Verify no pieces were added
      const squares = element.shadowRoot?.querySelectorAll('.square');
      squares?.forEach(square => {
        expect(square.querySelector('chess-piece')).toBeNull();
      });
    });
  });

  describe('Piece Selection and Movement', () => {
    it('should select a piece when Enter is pressed on a square with a piece', () => {
      // Set up a position with a piece on e4
      element.setFen('8/8/8/8/4P3/8/8/8 w - - 0 1');
      
      // Select e4 square
      element.selectSquare('e4');

      // Press Enter to select the piece
      const board = element.shadowRoot?.querySelector('.board') as HTMLElement;
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      board.dispatchEvent(enterEvent);

      // Verify that the piece is selected (currentSquare should be e4)
      expect(element.getSelectedPieceSquare()).toBe('e4');
    });

    it('should move a selected piece to a new square when Enter is pressed again', () => {
      // Set up a position with a piece on e4
      element.setFen('8/8/8/8/4P3/8/8/8 w - - 0 1');
      
      // Select e4 square
      element.selectSquare('e4');

      // Press Enter to select the piece
      const board = element.shadowRoot?.querySelector('.board') as HTMLElement;
      board.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(element.getSelectedPieceSquare()).toBe('e4');

      // Move to f4
      element.selectSquare('f4');
      board.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(element.getSelectedPieceSquare()).toBeNull(); // Piece should be moved, no longer selected

      // Verify that the piece moved to f4 and e4 is empty
      const e4Square = element.shadowRoot?.querySelector('[data-coordinate="e4"]') as HTMLElement;
      const f4Square = element.shadowRoot?.querySelector('[data-coordinate="f4"]') as HTMLElement;

      expect(e4Square.querySelector('chess-piece')).toBeNull();
      expect(f4Square.querySelector('chess-piece')?.getAttribute('piece')).toBe('p');
      expect(f4Square.querySelector('chess-piece')?.getAttribute('color')).toBe('w');
    });

    it('should not move a piece if no piece is selected', () => {
      // Set up a position with a piece on e4
      element.setFen('8/8/8/8/4P3/8/8/8 w - - 0 1');
      
      // Select f4 square (empty)
      element.selectSquare('f4');

      // Press Enter to attempt to move (no piece selected)
      const board = element.shadowRoot?.querySelector('.board') as HTMLElement;
      board.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(element.getSelectedPieceSquare()).toBeNull(); // No piece should be selected

    });

    it('should replace a piece if move piece over another piece', () => {
      // Set up a position with a piece on d4 and e4
      element.setFen('8/8/8/8/3Pp3/8/8/8 w - - 0 1');
      
      // Select d4 square (piece)
      element.selectPiece('d4');

      element.selectSquare('e4'); // Select e4 square (occupied by another piece)

      // Press Enter to attempt to move over the existing piece
      const board = element.shadowRoot?.querySelector('.board') as HTMLElement;
      board.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(element.getSelectedPieceSquare()).toBeNull(); // No piece should be selected

      expect(element.getPieceAt('d4')).toBeNull(); // d4 should be empty
      const e4Piece = element.getPieceAt('e4');
      expect(e4Piece).not.toBeNull();
      expect(e4Piece?.type).toBe('p');
      expect(e4Piece?.color).toBe('w'); // The white pawn from d4 should now be on e4
      
    });
  });
});
