/**
 * Regression tests for the FEN/FFEN auto-sync mechanism.
 *
 * Invariant: whenever the board position changes (via API, mouse, or keyboard),
 * getFen() and getFFen() must immediately reflect the new state.
 *
 * FEN is lossy (standard chess only — fairy info is dropped).
 * FFEN is lossless (JSON format preserving all fairy metadata).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ChessBoard } from '../src/ChessBoard.js';

let element: ChessBoard;

beforeEach(() => {
  element = new ChessBoard();
  document.body.appendChild(element);
});

// ─── helpers ──────────────────────────────────────────────────────────────────

function ffenPieces(board: ChessBoard): Array<{ square: string; type: string; color: string }> {
  const raw = board.getFFen();
  if (!raw) return [];
  const parsed = JSON.parse(raw) as { pieces: Array<{ square: string; type: string; color: string }> };
  return parsed.pieces;
}

// ─── addPiece ──────────────────────────────────────────────────────────────────

describe('FEN/FFEN sync — addPiece', () => {
  it('updates getFen() after adding a piece', () => {
    element.addPiece('e4', 'q', 'w');
    expect(element.getFen()).toBe('8/8/8/8/4Q3/8/8/8 w - - 0 1');
  });

  it('updates getFFen() after adding a piece', () => {
    element.addPiece('e4', 'q', 'w');
    const pieces = ffenPieces(element);
    expect(pieces).toHaveLength(1);
    expect(pieces[0]).toMatchObject({ square: 'e4', type: 'q', color: 'w' });
  });

  it('updates FEN after replacing piece on same square', () => {
    element.addPiece('e4', 'q', 'w');
    element.addPiece('e4', 'k', 'b');
    // black king → lowercase in FEN
    expect(element.getFen()).toBe('8/8/8/8/4k3/8/8/8 w - - 0 1');
  });

  it('FFEN has exactly one piece after replacing on same square', () => {
    element.addPiece('e4', 'q', 'w');
    element.addPiece('e4', 'k', 'b');
    const pieces = ffenPieces(element);
    expect(pieces).toHaveLength(1);
    expect(pieces[0]).toMatchObject({ type: 'k', color: 'b' });
  });

  it('accumulates pieces correctly in FEN and FFEN', () => {
    element.addPiece('a1', 'r', 'w');
    element.addPiece('h8', 'r', 'b');
    expect(element.getFen()).toBe('7r/8/8/8/8/8/8/R7 w - - 0 1');
    expect(ffenPieces(element)).toHaveLength(2);
  });
});

// ─── removePiece ──────────────────────────────────────────────────────────────

describe('FEN/FFEN sync — removePiece', () => {
  it('updates getFen() to empty board after removing the only piece', () => {
    element.addPiece('e4', 'q', 'w');
    element.removePiece('e4');
    expect(element.getFen()).toBe('8/8/8/8/8/8/8/8 w - - 0 1');
  });

  it('updates getFFen() to empty pieces after removing the only piece', () => {
    element.addPiece('e4', 'q', 'w');
    element.removePiece('e4');
    expect(ffenPieces(element)).toHaveLength(0);
  });

  it('getFen() remains consistent after partial removal', () => {
    element.addPiece('a1', 'r', 'w');
    element.addPiece('h8', 'r', 'b');
    element.removePiece('h8');
    expect(element.getFen()).toBe('8/8/8/8/8/8/8/R7 w - - 0 1');
    expect(ffenPieces(element)).toHaveLength(1);
  });
});

// ─── setPieces ────────────────────────────────────────────────────────────────

describe('FEN/FFEN sync — setPieces', () => {
  it('updates getFen() after setPieces', () => {
    element.setPieces([
      { square: 'e1', type: 'k', color: 'w' },
      { square: 'e8', type: 'k', color: 'b' }
    ]);
    expect(element.getFen()).toBe('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
  });

  it('updates getFFen() after setPieces', () => {
    element.setPieces([{ square: 'e1', type: 'k', color: 'w' }]);
    const pieces = ffenPieces(element);
    expect(pieces).toHaveLength(1);
    expect(pieces[0]).toMatchObject({ square: 'e1', type: 'k', color: 'w' });
  });

  it('getFen() reflects empty board after setPieces([])', () => {
    element.addPiece('e4', 'q', 'w');
    element.setPieces([]);
    expect(element.getFen()).toBe('8/8/8/8/8/8/8/8 w - - 0 1');
    expect(ffenPieces(element)).toHaveLength(0);
  });

  it('clears previous position from FEN when setPieces is called', () => {
    element.addPiece('a1', 'r', 'w');
    element.addPiece('h8', 'r', 'b');
    element.setPieces([{ square: 'd4', type: 'q', color: 'w' }]);
    // only the new piece should appear
    expect(element.getFen()).toBe('8/8/8/8/3Q4/8/8/8 w - - 0 1');
    expect(ffenPieces(element)).toHaveLength(1);
  });
});

// ─── setAttribute / setFen ────────────────────────────────────────────────────

describe('FEN/FFEN sync — setFen / setAttribute', () => {
  it('getFFen() is populated after setFen()', () => {
    element.setFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    // 32 pieces on starting position
    expect(ffenPieces(element)).toHaveLength(32);
  });

  it('getFen() echoes the loaded FEN after setFen()', () => {
    const fen = '8/8/8/8/4Q3/8/8/8 w - - 0 1';
    element.setFen(fen);
    expect(element.getFen()).toBe(fen);
  });

  it('setting fen attribute does NOT wipe the board (no re-render loop)', () => {
    element.setAttribute('fen', '8/8/8/8/4Q3/8/8/8 w - - 0 1');
    // Board should have the queen, not be empty
    expect(element.hasPiece('e4')).toBe(true);
    expect(element.getAllPieces()).toHaveLength(1);
  });

  it('getFFen() is populated after setAttribute fen', () => {
    element.setAttribute('fen', '8/8/8/8/8/8/8/8 w - - 0 1');
    expect(element.getFFen()).toContain('"pieces":[]');
  });

  it('subsequent addPiece after setFen updates FEN correctly', () => {
    element.setFen('8/8/8/8/4Q3/8/8/8 w - - 0 1');
    element.addPiece('a1', 'r', 'w');
    expect(element.getFen()).toContain('Q');
    expect(element.getFen()).toContain('R');
    expect(element.getAllPieces()).toHaveLength(2);
  });
});

// ─── No re-render loop ────────────────────────────────────────────────────────

describe('FEN/FFEN sync — no attribute re-render loop', () => {
  it('board is NOT cleared when getFen() is called after addPiece', () => {
    element.addPiece('e4', 'q', 'w');
    // calling getFen() must not trigger re-render
    element.getFen();
    expect(element.hasPiece('e4')).toBe(true);
  });

  it('board is NOT cleared when getFFen() is called after addPiece', () => {
    element.addPiece('e4', 'q', 'w');
    element.getFFen();
    expect(element.hasPiece('e4')).toBe(true);
  });

  it('multiple consecutive mutations keep FEN consistent', () => {
    element.addPiece('e1', 'k', 'w');
    element.addPiece('e8', 'k', 'b');
    element.addPiece('a1', 'r', 'w');
    element.removePiece('a1');
    expect(element.getFen()).toBe('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
    expect(element.getAllPieces()).toHaveLength(2);
  });
});
