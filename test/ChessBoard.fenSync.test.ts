/**
 * Regression tests for the FEN/FFEN auto-sync mechanism.
 *
 * Invariant: whenever the board position changes (via API, mouse, or keyboard),
 * getFen() must immediately reflect the new state.
 *
 * FEN is lossy (standard chess only — fairy info is dropped).
 * FFEN is lossless (JSON format preserving all fairy metadata).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { ChessBoard } from '../src/ChessBoard/ChessBoard.js';
import { parsePiecePlacement } from '../src/Utilities/fen.js';
import { PiecesOnBoard } from '../src/index.js';
import { waitForMicroTask } from './utils.js';

let element: ChessBoard;

beforeEach(() => {
  element = new ChessBoard();
  document.body.appendChild(element);
});

// ─── helpers ──────────────────────────────────────────────────────────────────

function ffenPieces(board: ChessBoard): PiecesOnBoard {
  const raw = board.getFen();
  if (!raw) return { };
  const parsed = parsePiecePlacement(raw.split(' ')[0]) ?? { pieces: {}, boardSize: { width: 0, height: 0 } };
  return parsed.pieces;
}

function countPieces(board: ChessBoard): number {
  return Object.keys(ffenPieces(board)).length;
}

// ─── addPiece ──────────────────────────────────────────────────────────────────

describe('FEN/FFEN sync — addPiece', () => {
  it('updates getFen() after adding a piece', () => {
    element.addPiece('e4', 'q', 'w');
    expect(element.getFen()).toBe('8/8/8/8/4Q3/8/8/8 w KQkq - 0 1');
  });

  it('updates getFen() after adding a piece', () => {
    element.addPiece('e4', 'q', 'w');
    const pieces = ffenPieces(element);
    expect(pieces).toHaveProperty('e4');
    expect(pieces['e4']).toMatchObject({ type: 'q', color: 'w' });
  });

  it('updates FEN after replacing piece on same square', () => {
    element.addPiece('e4', 'q', 'w');
    element.addPiece('e4', 'k', 'b');
    // black king → lowercase in FEN
    expect(element.getFen()).toBe('8/8/8/8/4k3/8/8/8 w KQkq - 0 1');
  });

  it('FFEN has exactly one piece after replacing on same square', () => {
    element.addPiece('e4', 'q', 'w');
    element.addPiece('e4', 'k', 'b');
    const pieces = ffenPieces(element);
    expect(countPieces(element)).toBe(1);
    expect(pieces['e4']).toMatchObject({ type: 'k', color: 'b' });
  });

  it('accumulates pieces correctly in FEN and FFEN', () => {
    element.addPiece('a1', 'r', 'w');
    element.addPiece('h8', 'r', 'b');
    expect(element.getFen()).toBe('7r/8/8/8/8/8/8/R7 w KQkq - 0 1');
    expect(countPieces(element)).toBe(2);
  });
});

// ─── removePiece ──────────────────────────────────────────────────────────────

describe('FEN/FFEN sync — removePiece', () => {
  it('updates getFen() to empty board after removing the only piece', () => {
    element.addPiece('e4', 'q', 'w');
    element.removePiece('e4');
    expect(element.getFen()).toBe('8/8/8/8/8/8/8/8 w KQkq - 0 1');
  });

  it('updates getFen() to empty pieces after removing the only piece', () => {
    element.addPiece('e4', 'q', 'w');
    element.removePiece('e4');
    expect(countPieces(element)).toBe(0);
  });

  it('getFen() remains consistent after partial removal', async () => {
    element.addPiece('a1', 'r', 'w');
    await waitForMicroTask();
    expect(element.getFen()).toBe('8/8/8/8/8/8/8/R7 w KQkq - 0 1');
    element.addPiece('h8', 'r', 'b');
    await waitForMicroTask();
    expect(element.getFen()).toBe('7r/8/8/8/8/8/8/R7 w KQkq - 0 1');
    element.removePiece('h8');
    await waitForMicroTask();

    expect(element.getFen()).toBe('8/8/8/8/8/8/8/R7 w KQkq - 0 1');
    expect(countPieces(element)).toBe(1);
  });
});

// ─── setPieces ────────────────────────────────────────────────────────────────

describe('FEN/FFEN sync — setPieces', () => {
  it('updates getFen() after setPieces', async () => {
    element.setPieces({
      'e1': { type: 'k', color: 'w' },
      'e8': { type: 'k', color: 'b' }
    });
    await waitForMicroTask();
    expect(element.getFen()).toBe('4k3/8/8/8/8/8/8/4K3 w KQkq - 0 1');
  });

  it('updates getFen() after setPieces', async () => {
    element.setPieces({
      'e1': { type: 'k', color: 'w' }
    });
    await waitForMicroTask();
    const pieces = ffenPieces(element);
    expect(countPieces(element)).toBe(1);
    expect(pieces['e1']).toMatchObject({ type: 'k', color: 'w' });
  });

  it('getFen() reflects empty board after setPieces([])', async () => {
    element.addPiece('e4', 'q', 'w');
    await waitForMicroTask();
    element.setPieces({});
    await waitForMicroTask();
    expect(element.getFen()).toBe('8/8/8/8/8/8/8/8 w KQkq - 0 1');
    expect(countPieces(element)).toBe(0);
  });

  it('clears previous position from FEN when setPieces is called', async () => {
    element.addPiece('a1', 'r', 'w');
    await waitForMicroTask();
    element.addPiece('h8', 'r', 'b');
    await waitForMicroTask();
    element.setPieces({
      'd4': { type: 'q', color: 'w' }
    });
    await waitForMicroTask();
    // only the new piece should appear
    expect(element.getFen()).toBe('8/8/8/8/3Q4/8/8/8 w KQkq - 0 1');
    expect(countPieces(element)).toBe(1);
  });
});

// ─── setAttribute / setFen ────────────────────────────────────────────────────

describe('FEN/FFEN sync — setFen / setAttribute', () => {
  it('getFen() is populated after setFen()', () => {
    element.setFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    const pieceCount = countPieces(element);
    // 32 pieces on starting position
    expect(pieceCount).toBe(32);
  });

  it('getFen() echoes the loaded FEN after setFen()', () => {
    const fen = '8/8/8/8/4Q3/8/8/8 w - - 0 1';
    element.setFen(fen);
    expect(element.getFen()).toBe(fen);
  });

  it('setting fen attribute does NOT wipe the board (no re-render loop)', async () => {
    element.setAttribute('fen', '8/8/8/8/4Q3/8/8/8 w - - 0 1');
    await waitForMicroTask();
    // Board should have the queen, not be empty
    expect(element.hasPiece('e4')).toBe(true);
    expect(element.getAllPieces()).toHaveLength(1);
  });

  it('getFen() is populated after setAttribute fen', () => {
    element.setAttribute('fen', '8/8/8/8/8/8/8/8 w - - 0 1');
    expect(element.getFen()).toContain('8/8/8/8/8/8/8/8');
  });

  it('subsequent addPiece after setFen updates FEN correctly', async () => {
    element.setFen('8/8/8/8/4Q3/8/8/8 w - - 0 1');
    element.addPiece('a1', 'r', 'w');
    await waitForMicroTask();
    expect(element.getFen()).toContain('Q');
    expect(element.getFen()).toContain('R');
    expect(element.getAllPieces()).toHaveLength(2);
  });
});

// ─── No re-render loop ────────────────────────────────────────────────────────

describe('FEN/FFEN sync — no attribute re-render loop', () => {
  it('board is NOT cleared when getFen() is called after addPiece', async () => {
    element.addPiece('e4', 'q', 'w');
    await waitForMicroTask();
    // calling getFen() must not trigger re-render
    element.getFen();
    expect(element.hasPiece('e4')).toBe(true);
  });

  it('board is NOT cleared when getFen() is called after addPiece', async () => {
    element.addPiece('e4', 'q', 'w');
    await waitForMicroTask();
    element.getFen();
    expect(element.hasPiece('e4')).toBe(true);
  });

  it('multiple consecutive mutations keep FEN consistent', async () => {
    element.addPiece('e1', 'k', 'w');
    element.addPiece('e8', 'k', 'b');
    element.addPiece('a1', 'r', 'w');
    element.removePiece('a1');
    await waitForMicroTask();
    expect(element.getFen()).toBe('4k3/8/8/8/8/8/8/4K3 w KQkq - 0 1');
    expect(element.getAllPieces()).toHaveLength(2);
  });
});
