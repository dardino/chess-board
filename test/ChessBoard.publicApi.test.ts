import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ChessBoard, PieceInfoWithSquare } from '../src/ChessBoard';

describe('ChessBoard Public API - Piece Manipulation', () => {
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

  describe('addPiece', () => {
    it('should add a piece to an empty square', () => {
      element.addPiece('e4', 'q', 'w');
      
      const piece = element.getPieceAt('e4');
      expect(piece).not.toBeNull();
      expect(piece?.type).toBe('q');
      expect(piece?.color).toBe('w');
      expect(piece?.rotation).toBeUndefined();
      expect(element.getFen()).toBe('8/8/8/8/4Q3/8/8/8 w - - 0 1');
      expect(element.getFen()).not.toContain('*0.5Q');
    });

    it('should add a piece with rotation', () => {
      element.addPiece('e4', 'q', 'w', '45');
      
      const piece = element.getPieceAt('e4');
      expect(piece).not.toBeNull();
      expect(piece?.rotation).toBe('45');
      expect(element.getFen()).toContain('*0.5Q');
    });

    it('should replace existing piece on square', () => {
      element.addPiece('e4', 'q', 'w');
      element.addPiece('e4', 'k', 'b');
      
      const piece = element.getPieceAt('e4');
      expect(piece?.type).toBe('k');
      expect(piece?.color).toBe('b');
      expect(element.getFen()).toBe('8/8/8/8/4k3/8/8/8 w - - 0 1');
    });

    it('should throw error for invalid square coordinate', () => {
      expect(() => element.addPiece('z9', 'q', 'w')).toThrow('Invalid square coordinate');
      expect(() => element.addPiece('', 'q', 'w')).toThrow('Invalid square coordinate');
      expect(() => element.addPiece('e', 'q', 'w')).toThrow('Invalid square coordinate');
      expect(() => element.addPiece('e10', 'q', 'w')).toThrow('Invalid square coordinate');
    });

    it('should add all standard piece types', () => {
      const pieces: Array<{ square: string, type: 'k' | 'q' | 'r' | 'b' | 'n' | 'p', color: 'w' | 'b' }> = [
        { square: 'a1', type: 'k', color: 'w' },
        { square: 'b1', type: 'q', color: 'w' },
        { square: 'c1', type: 'r', color: 'w' },
        { square: 'd1', type: 'b', color: 'w' },
        { square: 'e1', type: 'n', color: 'w' },
        { square: 'f1', type: 'p', color: 'w' }
      ];

      pieces.forEach(({ square, type, color }) => {
        element.addPiece(square, type, color);
        const piece = element.getPieceAt(square);
        expect(piece?.type).toBe(type);
        expect(piece?.color).toBe(color);
      });
    });

    it('should add fairy pieces', () => {
      element.addPiece('a1', 'e', 'w');
      element.addPiece('b1', 't', 'b');
      element.addPiece('c1', 'a', 'n');

      expect(element.getPieceAt('a1')?.type).toBe('e');
      expect(element.getPieceAt('b1')?.type).toBe('t');
      expect(element.getPieceAt('c1')?.type).toBe('a');
    });

    it('should add neutral pieces', () => {
      element.addPiece('e4', 'p', 'n');
      
      const piece = element.getPieceAt('e4');
      expect(piece?.color).toBe('n');
      expect(element.getFen()).toContain('-P');
    });
  });

  describe('removePiece', () => {
    it('should remove a piece from square', () => {
      element.addPiece('e4', 'q', 'w');
      expect(element.hasPiece('e4')).toBe(true);
      
      element.removePiece('e4');
      expect(element.hasPiece('e4')).toBe(false);
      expect(element.getPieceAt('e4')).toBeNull();
      expect(element.getFen()).toBe('8/8/8/8/8/8/8/8 w - - 0 1');
    });

    it('should not throw error when removing from empty square', () => {
      expect(() => element.removePiece('e4')).not.toThrow();
      expect(element.getPieceAt('e4')).toBeNull();
    });

    it('should throw error for invalid square coordinate', () => {
      expect(() => element.removePiece('z9')).toThrow('Invalid square coordinate');
    });
  });

  describe('getPieceAt', () => {
    it('should return null for empty square', () => {
      expect(element.getPieceAt('e4')).toBeNull();
    });

    it('should return piece information', () => {
      element.addPiece('e4', 'q', 'w', '90');
      
      const piece = element.getPieceAt('e4');
      expect(piece).toEqual({
        type: 'q',
        color: 'w',
        rotation: '90'
      });
    });

    it('should throw error for invalid square coordinate', () => {
      expect(() => element.getPieceAt('z9')).toThrow('Invalid square coordinate');
    });
  });

  describe('hasPiece', () => {
    it('should return false for empty square', () => {
      expect(element.hasPiece('e4')).toBe(false);
    });

    it('should return true for occupied square', () => {
      element.addPiece('e4', 'q', 'w');
      expect(element.hasPiece('e4')).toBe(true);
    });

    it('should throw error for invalid square coordinate', () => {
      expect(() => element.hasPiece('z9')).toThrow('Invalid square coordinate');
    });
  });

  describe('selectPiece', () => {
    it('should select the piece and set its square as current', () => {
      element.addPiece('e4', 'q', 'w');

      expect(element.selectPiece('e4')).toBe(true);
      expect(element.getCurrentSquare()).toBe('e4');
      expect(element.getSelectedPieceSquare()).toBe('e4');

      const square = element.shadowRoot?.querySelector('[data-coordinate="e4"]');
      expect(square?.classList.contains('selected-piece')).toBe(true);
    });

    it('should clear the selection and return false for an empty square', () => {
      element.addPiece('e4', 'q', 'w');
      element.selectPiece('e4');

      expect(element.selectPiece('f4')).toBe(false);
      expect(element.getCurrentSquare()).toBe('f4');
      expect(element.getSelectedPieceSquare()).toBeNull();
    });

    it('should throw an error for an invalid square coordinate', () => {
      expect(() => element.selectPiece('z9')).toThrow('Invalid square coordinate');
    });
  });

  describe('getAllPieces', () => {
    it('should return empty array for empty board', () => {
      const pieces = element.getAllPieces();
      expect(pieces).toEqual([]);
    });

    it('should return all pieces on board', () => {
      element.addPiece('e4', 'q', 'w');
      element.addPiece('d4', 'k', 'b', '45');
      element.addPiece('c3', 'r', 'w');

      const pieces = element.getAllPieces();
      expect(pieces).toHaveLength(3);
      
      const e4Piece = pieces.find(p => p.square === 'e4');
      expect(e4Piece).toEqual({ square: 'e4', type: 'q', color: 'w' });
      
      const d4Piece = pieces.find(p => p.square === 'd4');
      expect(d4Piece).toEqual({ square: 'd4', type: 'k', color: 'b', rotation: '45' });
    });

    it('should return pieces in consistent order', () => {
      element.addPiece('a1', 'r', 'w');
      element.addPiece('h8', 'r', 'b');
      
      const pieces1 = element.getAllPieces();
      const pieces2 = element.getAllPieces();
      
      expect(pieces1).toEqual(pieces2);
    });
  });

  describe('setPieces', () => {
    it('should set multiple pieces at once', () => {
      const piecesToSet: Array<PieceInfoWithSquare> = [
        { square: 'e4', type: 'q', color: 'w', rotation: '0' },
        { square: 'd4', type: 'k', color: 'b', rotation: '45' },
        { square: 'c3', type: 'r', color: 'w' }
      ];

      element.setPieces(piecesToSet);

      const pieces = element.getAllPieces();
      expect(pieces).toHaveLength(3);
      expect(element.hasPiece('e4')).toBe(true);
      expect(element.hasPiece('d4')).toBe(true);
      expect(element.hasPiece('c3')).toBe(true);
      expect(element.getFen()).toBe('8/8/8/8/3*0.5kQ3/2R5/8/8 w - - 0 1');
    });

    it('should clear board before setting pieces', () => {
      element.addPiece('a1', 'r', 'w');
      element.addPiece('h8', 'r', 'b');

      element.setPieces([
        { square: 'e4', type: 'q', color: 'w', rotation: '0' }
      ]);

      const pieces = element.getAllPieces();
      expect(pieces).toHaveLength(1);
      expect(element.hasPiece('a1')).toBe(false);
      expect(element.hasPiece('h8')).toBe(false);
    });

    it('should throw error if any coordinate is invalid', () => {
      const invalidPieces: Array<PieceInfoWithSquare> = [
        { square: 'e4', type: 'q', color: 'w', rotation: '0' },
        { square: 'z9', type: 'k', color: 'b', rotation: '0' }
      ];

      expect(() => element.setPieces(invalidPieces)).toThrow('Invalid square coordinate');
      
      // Board should not be modified if validation fails
      element.addPiece('a1', 'r', 'w');
      expect(() => element.setPieces(invalidPieces)).toThrow();
      expect(element.hasPiece('a1')).toBe(true);
    });

    it('should handle empty array', () => {
      element.addPiece('e4', 'q', 'w');
      element.setPieces([]);
      
      expect(element.getAllPieces()).toHaveLength(0);
      expect(element.getFen()).toBe('8/8/8/8/8/8/8/8 w - - 0 1');
    });
  });

  describe('setCellDecorators', () => {
    it('should add a decorator layer to the specified cells', () => {
      element.setCellDecorators({
        e4: { backgroundColor: '#ff0000', innerBorder: 'solid 1px red' },
        d4: { backgroundColor: 'rgba(0, 0, 255, 0.35)', innerBorder: 'solid 2px blue' }
      });

      const e4Square = element.shadowRoot!.querySelector('[data-coordinate="e4"]') as HTMLElement;
      const d4Square = element.shadowRoot!.querySelector('[data-coordinate="d4"]') as HTMLElement;

      const e4Decorator = e4Square.querySelector('.cell-decorator') as HTMLElement;
      const d4Decorator = d4Square.querySelector('.cell-decorator') as HTMLElement;

      expect(e4Decorator).not.toBeNull();
      expect(d4Decorator).not.toBeNull();
      expect(e4Decorator.style.backgroundColor).toBe('#ff0000');
      expect(e4Decorator.style.border).toBe('1px solid red');
      expect(d4Decorator.style.backgroundColor).toBe('rgba(0, 0, 255, 0.35)');
      expect(d4Decorator.style.border).toBe('2px solid blue');
    });

    it('should clear decorators for cells not present in the map', () => {
      element.setCellDecorators({
        e4: { backgroundColor: '#00ff00', innerBorder: 'solid 1px green' }
      });

      const e4Square = element.shadowRoot!.querySelector('[data-coordinate="e4"]') as HTMLElement;
      expect(e4Square.querySelector('.cell-decorator')).not.toBeNull();

      element.setCellDecorators({
        d4: { backgroundColor: '#0000ff', innerBorder: 'solid 1px blue' }
      });

      expect(e4Square.querySelector('.cell-decorator')).toBeNull();

      const d4Square = element.shadowRoot!.querySelector('[data-coordinate="d4"]') as HTMLElement;
      expect(d4Square.querySelector('.cell-decorator')).not.toBeNull();
    });
  });
});

describe('ChessBoard Public API - Rotation', () => {
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

  describe('rotatePiece', () => {
    it('should rotate piece by positive degrees', () => {
      element.addPiece('e4', 'q', 'w');
      element.rotatePiece('e4', 45);
      
      expect(element.getPieceRotation('e4')).toBe('45');
    });

    it('should rotate piece by negative degrees', () => {
      element.addPiece('e4', 'q', 'w', '90');
      element.rotatePiece('e4', -45);
      
      expect(element.getPieceRotation('e4')).toBe('45');
    });

    it('should handle rotation wrapping around 360°', () => {
      element.addPiece('e4', 'q', 'w', '315');
      element.rotatePiece('e4', 90);
      
      expect(element.getPieceRotation('e4')).toBe('45');
    });

    it('should round to nearest 45°', () => {
      element.addPiece('e4', 'q', 'w');
      element.rotatePiece('e4', 50);
      
      expect(element.getPieceRotation('e4')).toBe('45');
    });

    it('should throw error for invalid square', () => {
      expect(() => element.rotatePiece('z9', 45)).toThrow('Invalid square coordinate');
    });

    it('should throw error for empty square', () => {
      expect(() => element.rotatePiece('e4', 45)).toThrow('No piece at square e4');
    });
  });

  describe('setPieceRotation', () => {
    it('should set absolute rotation', () => {
      element.addPiece('e4', 'q', 'w');
      element.setPieceRotation('e4', '180');
      
      expect(element.getPieceRotation('e4')).toBe('180');
    });

    it('should override previous rotation', () => {
      element.addPiece('e4', 'q', 'w', '45');
      element.setPieceRotation('e4', '270');
      
      expect(element.getPieceRotation('e4')).toBe('270');
    });

    it('should throw error for invalid square', () => {
      expect(() => element.setPieceRotation('z9', '45')).toThrow('Invalid square coordinate');
    });

    it('should throw error for empty square', () => {
      expect(() => element.setPieceRotation('e4', '45')).toThrow('No piece at square e4');
    });
  });

  describe('getPieceRotation', () => {
    it('should return undefined for empty square', () => {
      expect(element.getPieceRotation('e4')).toBeUndefined();
    });

    it('should return piece rotation', () => {
      element.addPiece('e4', 'q', 'w', '135');
      expect(element.getPieceRotation('e4')).toBe('135');
    });

    it('should return undefined for piece without explicit rotation', () => {
      element.addPiece('e4', 'q', 'w');
      expect(element.getPieceRotation('e4')).toBe(undefined);
    });

    it('should throw error for invalid square', () => {
      expect(() => element.getPieceRotation('z9')).toThrow('Invalid square coordinate');
    });
  });
});

describe('ChessBoard Public API - Orientation', () => {
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

  describe('setOrientation', () => {
    it('should set white orientation', () => {
      element.setOrientation('white');
      expect(element.getOrientation()).toBe('white');
      expect(element.hasAttribute('black-to-move')).toBe(false);
    });

    it('should set black orientation', () => {
      element.setOrientation('black');
      expect(element.getOrientation()).toBe('black');
      expect(element.hasAttribute('black-to-move')).toBe(true);
    });

    it('should change orientation from white to black', () => {
      element.setOrientation('white');
      element.setOrientation('black');
      expect(element.getOrientation()).toBe('black');
    });

    it('should change orientation from black to white', () => {
      element.setOrientation('black');
      element.setOrientation('white');
      expect(element.getOrientation()).toBe('white');
    });
  });

  describe('getOrientation', () => {
    it('should return "white" by default', () => {
      expect(element.getOrientation()).toBe('white');
    });

    it('should return current orientation', () => {
      element.setOrientation('black');
      expect(element.getOrientation()).toBe('black');
    });
  });

  describe('toggleOrientation', () => {
    it('should toggle from white to black', () => {
      expect(element.getOrientation()).toBe('white');
      element.toggleOrientation();
      expect(element.getOrientation()).toBe('black');
    });

    it('should toggle from black to white', () => {
      element.setOrientation('black');
      element.toggleOrientation();
      expect(element.getOrientation()).toBe('white');
    });

    it('should toggle multiple times', () => {
      element.toggleOrientation(); // white -> black
      expect(element.getOrientation()).toBe('black');
      
      element.toggleOrientation(); // black -> white
      expect(element.getOrientation()).toBe('white');
      
      element.toggleOrientation(); // white -> black
      expect(element.getOrientation()).toBe('black');
    });
  });
});

describe('ChessBoard Public API - Integration', () => {
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

  it('should add, rotate, and remove piece', () => {
    element.addPiece('e4', 'q', 'w');
    expect(element.hasPiece('e4')).toBe(true);
    
    element.rotatePiece('e4', 90);
    expect(element.getPieceRotation('e4')).toBe('90');
    
    element.removePiece('e4');
    expect(element.hasPiece('e4')).toBe(false);
  });

  it('should work with getAllPieces and setPieces', () => {
    element.addPiece('e4', 'q', 'w', '45');
    element.addPiece('d4', 'k', 'b');
    
    const pieces = element.getAllPieces();
    expect(pieces).toHaveLength(2);
    
    // Create new array with modified rotation
    const modifiedPieces = pieces.map(p => 
      p.square === 'e4' ? { ...p, rotation: '90' as const } : p
    );
    element.setPieces(modifiedPieces);
    
    expect(element.getPieceRotation('e4')).toBe('90');
  });

  it('should maintain pieces after orientation change', () => {
    element.addPiece('e4', 'q', 'w');
    element.addPiece('d5', 'k', 'b');
    
    element.toggleOrientation();
    
    expect(element.hasPiece('e4')).toBe(true);
    expect(element.hasPiece('d5')).toBe(true);
  });

  it('should work with FEN methods', () => {
    element.setStartingPosition();
    
    const piecesBeforeClear = element.getAllPieces();
    expect(piecesBeforeClear.length).toBeGreaterThan(0);
    
    element.clearBoard();
    expect(element.getAllPieces()).toHaveLength(0);
    
    element.addPiece('e4', 'q', 'w');
    expect(element.getAllPieces()).toHaveLength(1);
  });

  it('should handle complex scenario with multiple operations', () => {
    // Setup initial position
    element.setPieces([
      { square: 'e1', type: 'k', color: 'w', rotation: '0' },
      { square: 'e8', type: 'k', color: 'b', rotation: '0' },
      { square: 'd1', type: 'q', color: 'w', rotation: '0' },
      { square: 'd8', type: 'q', color: 'b', rotation: '0' }
    ]);
    
    expect(element.getAllPieces()).toHaveLength(4);
    
    // Rotate a piece
    element.rotatePiece('d1', 45);
    expect(element.getPieceRotation('d1')).toBe('45');
    
    // Replace a piece
    element.addPiece('d1', 'r', 'w', '90');
    expect(element.getPieceAt('d1')?.type).toBe('r');
    expect(element.getPieceRotation('d1')).toBe('90');
    
    // Remove a piece
    element.removePiece('d8');
    expect(element.getAllPieces()).toHaveLength(3);
    
    // Change orientation
    element.setOrientation('black');
    expect(element.getOrientation()).toBe('black');
    
    // Verify pieces still intact
    expect(element.hasPiece('e1')).toBe(true);
    expect(element.hasPiece('e8')).toBe(true);
    expect(element.hasPiece('d1')).toBe(true);
  });
});
