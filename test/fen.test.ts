import { describe, expect, it } from 'vitest';
import { PieceInfo, PiecesOnBoard } from '../src';
import {
  getEmptyBoardFen,
  getStartingPositionFen,
  parseFairyMetadata,
  parseFen,
  parseFfenPieceChar,
  parsePiecePlacement,
  piecesToFenString,
  pieceToChar,
  pieceToFfenChar,
  positionToFen,
  type FenPosition
} from '../src/Utilities/fen';

function countPieces(pieces?: PiecesOnBoard): number {
  return pieces ? Object.keys(pieces).length : 0;
}

describe('FEN Utilities', () => {
  describe('pieceToChar', () => {
    it('should convert white king to K', () => {
      const piece: PieceInfo = { type: 'k', color: 'w' };
      expect(pieceToChar(piece)).toBe('K');
    });

    it('should convert black queen to q', () => {
      const piece: PieceInfo = { type: 'q', color: 'b' };
      expect(pieceToChar(piece)).toBe('q');
    });

    it('should convert white pawn to P', () => {
      const piece: PieceInfo = { type: 'p', color: 'w' };
      expect(pieceToChar(piece)).toBe('P');
    });
  });

  describe('parsePiecePlacement', () => {
    it('should parse starting position piece placement', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
      const pieces = parsePiecePlacement(fen);

      expect(countPieces(pieces?.pieces)).toBe(32);

      // Check some specific pieces
      expect(pieces?.pieces['a8']).toEqual({ type: 'r', color: 'b' });
      expect(pieces?.pieces['e8']).toEqual({ type: 'k', color: 'b' });
      expect(pieces?.pieces['a7']).toEqual({ type: 'p', color: 'b' });
      expect(pieces?.pieces['a1']).toEqual({ type: 'r', color: 'w' });
      expect(pieces?.pieces['e1']).toEqual({ type: 'k', color: 'w' });
      expect(pieces?.pieces['a2']).toEqual({ type: 'p', color: 'w' });
    });

    it('should parse empty board', () => {
      const fen = '8/8/8/8/8/8/8/8';
      const {pieces} = parsePiecePlacement(fen) ?? { pieces: {} };
      expect(countPieces(pieces)).toBe(0);
    });

    it('should parse position with some pieces', () => {
      const fen = 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R';
      const {pieces} = parsePiecePlacement(fen) ?? { pieces: {} as PiecesOnBoard, boardSize: 8 };

      expect(countPieces(pieces)).toBe(32);

      // Check specific positions
      expect(pieces['a8']).toEqual({ type: 'r', color: 'b' });
      expect(pieces['c6']).toEqual({ type: 'n', color: 'b' });
      expect(pieces['e5']).toEqual({ type: 'p', color: 'b' });
      expect(pieces['e4']).toEqual({ type: 'p', color: 'w' });
      expect(pieces['f3']).toEqual({ type: 'n', color: 'w' });
    });

    it('should return null for invalid FEN', () => {
      expect(parsePiecePlacement('')).toBeNull();
      expect(parsePiecePlacement('invalid')).toBeNull();
    });
  });

  describe('piecesToFenString', () => {
    it('should convert pieces back to FEN string', () => {
      const pieces: PiecesOnBoard = {
        'a8': { type: 'r', color: 'b' },
        'b8': { type: 'n', color: 'b' },
        'c8': { type: 'b', color: 'b' },
        'd8': { type: 'q', color: 'b' },
        'e8': { type: 'k', color: 'b' },
        'f8': { type: 'b', color: 'b' },
        'g8': { type: 'n', color: 'b' },
        'h8': { type: 'r', color: 'b' },
        // Add pawns
        'a7': { type: 'p', color: 'b' },
        'b7': { type: 'p', color: 'b' },
        'c7': { type: 'p', color: 'b' },
        'd7': { type: 'p', color: 'b' },
        'e7': { type: 'p', color: 'b' },
        'f7': { type: 'p', color: 'b' },
        'g7': { type: 'p', color: 'b' },
        'h7': { type: 'p', color: 'b' },
        // White pieces
        'a2': { type: 'p', color: 'w' },
        'b2': { type: 'p', color: 'w' },
        'c2': { type: 'p', color: 'w' },
        'd2': { type: 'p', color: 'w' },
        'e2': { type: 'p', color: 'w' },
        'f2': { type: 'p', color: 'w' },
        'g2': { type: 'p', color: 'w' },
        'h2': { type: 'p', color: 'w' },
        'a1': { type: 'r', color: 'w' },
        'b1': { type: 'n', color: 'w' },
        'c1': { type: 'b', color: 'w' },
        'd1': { type: 'q', color: 'w' },
        'e1': { type: 'k', color: 'w' },
        'f1': { type: 'b', color: 'w' },
        'g1': { type: 'n', color: 'w' },
        'h1': { type: 'r', color: 'w' }
      };

      const fenString = piecesToFenString(pieces);
      expect(fenString).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
    });

    it('should handle empty board', () => {
      const pieces: PiecesOnBoard = {};
      const fenString = piecesToFenString(pieces);
      expect(fenString).toBe('8/8/8/8/8/8/8/8');
    });

    it('should handle sparse pieces', () => {
      const pieces: PiecesOnBoard = {
        'e1': { type: 'k', color: 'w' },
        'e8': { type: 'k', color: 'b' }
      };
      const fenString = piecesToFenString(pieces);
      expect(fenString).toBe('4k3/8/8/8/8/8/8/4K3');
    });
  });

  describe('parseFen', () => {

    it.each([
      { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR', description: 'FEN with first part only' },
      { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w', description: 'FEN with active color' },
      { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq', description: 'FEN with castling rights' },
      { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -', description: 'FEN with en passant target' },
      { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0', description: 'FEN with halfmove clock' },
      { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', description: 'full FEN' },
    ])('should parse complete starting position $description', ({ fen }) => {
      const position = parseFen(fen);

      expect(position).not.toBeNull();
      expect(countPieces(position?.pieces)).toBe(32);
      expect(position?.activeColor).toBe('w');
      expect(position?.castlingRights).toBe('KQkq');
      expect(position?.enPassantTarget).toBe('-');
      expect(position?.halfmoveClock).toBe(0);
      expect(position?.fullmoveNumber).toBe(1);
    });

    it('should parse FEN with black to move', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      const position = parseFen(fen);

      expect(position).not.toBeNull();
      expect(position?.activeColor).toBe('b');
      expect(position?.enPassantTarget).toBe('e3');
    });

    it('should parse FEN with no castling rights', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1';
      const position = parseFen(fen);

      expect(position).not.toBeNull();
      expect(position?.castlingRights).toBe('-');
    });

    it('should return null for invalid FEN', () => {
      expect(parseFen('')).toBeNull();
      expect(parseFen('invalid')).toBeNull();
      expect(parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 extra')).toBeNull();
      expect(parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR x KQkq - 0 1')).toBeNull(); // Invalid color
      expect(parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - -1 1')).toBeNull(); // Negative halfmove
      expect(parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 0')).toBeNull(); // Invalid fullmove
    });
  });

  describe('positionToFen', () => {
    it('should convert position back to FEN string', () => {
      const position: FenPosition = {
        pieces: {
          'a8': { type: 'r' as const, color: 'b' as const },
          'e8': { type: 'k' as const, color: 'b' as const },
          'a1': { type: 'r' as const, color: 'w' as const },
          'e1': { type: 'k' as const, color: 'w' as const }
        },
        activeColor: 'w' as const,
        castlingRights: 'KQkq',
        enPassantTarget: '-',
        halfmoveClock: 0,
        fullmoveNumber: 1,
        boardSize: { width: 8, height: 8 }
      };

      const fen = positionToFen(position);
      expect(fen).toBe('r3k3/8/8/8/8/8/8/R3K3 w KQkq - 0 1');
    });
  });

  describe('getStartingPositionFen', () => {
    it('should return the standard starting position', () => {
      const fen = getStartingPositionFen();
      expect(fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

      // Verify it's parseable
      const position = parseFen(fen);
      expect(position).not.toBeNull();
      expect(countPieces(position?.pieces)).toBe(32);
    });
  });

  describe('getEmptyBoardFen', () => {
    it('should return an empty board position', () => {
      const fen = getEmptyBoardFen();
      expect(fen).toBe('8/8/8/8/8/8/8/8 w - - 0 1');

      // Verify it's parseable
      const position = parseFen(fen);
      expect(position).not.toBeNull();
      expect(countPieces(position?.pieces)).toBe(0);
    });
  });

  describe('round-trip conversion', () => {
    it('should maintain FEN through parse and convert back', () => {
      const originalFen = 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 4 4';
      const position = parseFen(originalFen);

      expect(position).not.toBeNull();

      const convertedFen = positionToFen(position!);
      expect(convertedFen).toBe(originalFen);
    });

    it('should maintain piece placement through round-trip', () => {
      const originalPieces: PiecesOnBoard = {
        'e1': { type: 'k', color: 'w' },
        'd1': { type: 'q', color: 'w' },
        'e8': { type: 'k', color: 'b' }
      };

      const fenString = piecesToFenString(originalPieces);
      const { pieces: parsedPieces} = parsePiecePlacement(fenString) ?? {};

      expect(countPieces(parsedPieces)).toBe(3);
      expect(parsedPieces?.['e1']).toEqual(originalPieces['e1']);
      expect(parsedPieces?.['d1']).toEqual(originalPieces['d1']);
      expect(parsedPieces?.['e8']).toEqual(originalPieces['e8']);
    });
  });

  describe('FFEN (Fairy FEN) Utilities', () => {
    describe('parseFfenPieceChar', () => {
      it('should parse neutral pieces with - prefix', () => {
        expect(parseFfenPieceChar('-K')).toEqual({ type: 'k', color: 'n', isNeutral: true, rotation: undefined });
        expect(parseFfenPieceChar('-q')).toEqual({ type: 'q', color: 'n', isNeutral: true, rotation: undefined });
        expect(parseFfenPieceChar('-C')).toEqual({ type: 'c', color: 'n', isNeutral: true, rotation: undefined });
      });

      it('should parse rotated pieces with * prefix', () => {
        expect(parseFfenPieceChar('*0.5K')).toEqual({ type: 'k', color: 'w', isNeutral: false, rotation: 0.5 });
        expect(parseFfenPieceChar('*1q')).toEqual({ type: 'q', color: 'b', isNeutral: false, rotation: 1 });
        expect(parseFfenPieceChar('*1.5r')).toEqual({ type: 'r', color: 'b', isNeutral: false, rotation: 1.5 });
        expect(parseFfenPieceChar('*2B')).toEqual({ type: 'b', color: 'w', isNeutral: false, rotation: 2 });
        expect(parseFfenPieceChar('*2.5n')).toEqual({ type: 'n', color: 'b', isNeutral: false, rotation: 2.5 });
        expect(parseFfenPieceChar('*3P')).toEqual({ type: 'p', color: 'w', isNeutral: false, rotation: 3 });
        expect(parseFfenPieceChar('*3.5p')).toEqual({ type: 'p', color: 'b', isNeutral: false, rotation: 3.5 });
      });

      it('should parse neutral rotated pieces', () => {
        expect(parseFfenPieceChar('-*1K')).toEqual({ type: 'k', color: 'n', isNeutral: true, rotation: 1 });
        expect(parseFfenPieceChar('-*2.5q')).toEqual({ type: 'q', color: 'n', isNeutral: true, rotation: 2.5 });
      });

      it('should parse fairy letters (black only)', () => {
        expect(parseFfenPieceChar("'a")).toEqual({ type: 'a', color: 'b', isNeutral: false, rotation: undefined, fairyName: 'a' });
        expect(parseFfenPieceChar("'A")).toEqual({ type: 'a', color: 'b', isNeutral: false, rotation: undefined, fairyName: 'A' });
      });

      it('should parse fairy numbers (black only)', () => {
        expect(parseFfenPieceChar("'7")).toEqual({ type: 'a', color: 'b', isNeutral: false, rotation: undefined, fairyName: '7' });
        expect(parseFfenPieceChar("''23")).toEqual({ type: 'a', color: 'b', isNeutral: false, rotation: undefined, fairyName: '23' });
      });

      it('should parse markers (C, X, S, T)', () => {
        expect(parseFfenPieceChar('C')).toEqual({ type: 'c', color: 'w', isNeutral: false, rotation: undefined });
        expect(parseFfenPieceChar('X')).toEqual({ type: 'x', color: 'w', isNeutral: false, rotation: undefined });
        expect(parseFfenPieceChar('s')).toEqual({ type: 's', color: 'b', isNeutral: false, rotation: undefined });
        expect(parseFfenPieceChar('T')).toEqual({ type: 't', color: 'w', isNeutral: false, rotation: undefined });
      });

      it('should return null for invalid pieces', () => {
        expect(parseFfenPieceChar('')).toBeNull();
        expect(parseFfenPieceChar('*')).toBeNull();
        expect(parseFfenPieceChar('*4K')).toBeNull(); // Invalid rotation (not in 0.5, 1, 1.5, ..., 3.5)
        expect(parseFfenPieceChar('*Z')).toBeNull(); // Invalid syntax
      });
    });

    describe('parseFairyMetadata', () => {
      it('should parse fairy metadata entries', () => {
        const result = parseFairyMetadata('d5:gn:Chamaleon,e5:(1,5)-leaper:None');
        expect(result).toEqual({
          'd5': { fairyName: 'gn', fairyCondition: 'Chamaleon' },
          'e5': { fairyName: '(1,5)-leaper', fairyCondition: 'None' }
        });
      });

      it('should return undefined for empty block', () => {
        expect(parseFairyMetadata('')).toBeUndefined();
        expect(parseFairyMetadata('   ')).toBeUndefined();
      });

      it('should return undefined for invalid format', () => {
        expect(parseFairyMetadata('d5:gn')).toBeUndefined(); // Missing fairycondition
        expect(parseFairyMetadata('d5:gn:Chamaleon:extra')).toBeUndefined(); // Too many parts
        expect(parseFairyMetadata('invalid:gn:Chamaleon')).toBeUndefined(); // Invalid cell format
      });

      it('should return undefined if metadata contains spaces', () => {
        expect(parseFairyMetadata('d5:gn name:Chamaleon')).toBeUndefined();
        expect(parseFairyMetadata('d5:gn:Chamaleon type')).toBeUndefined();
      });
    });

    describe('pieceToFfenChar', () => {
      it('should convert neutral pieces to FFEN format', () => {
        const piece: PieceInfo = { type: 'k', color: 'n' };
        expect(pieceToFfenChar(piece)).toBe('-K');
      });

      it('should convert rotated pieces to FFEN format', () => {
        let piece: PieceInfo = { type: 'q', color: 'w', rotation: "90" };
        expect(pieceToFfenChar(piece)).toBe('*1Q');
        
        piece = { type: 'r', color: 'b', rotation: "225" };
        expect(pieceToFfenChar(piece)).toBe('*2.5r');
      });

      it('should convert fairy letters to FFEN format', () => {
        const piece: PieceInfo = { type: '\'a', color: 'b' };
        expect(pieceToFfenChar(piece)).toBe("'a");
      });

      it('should convert fairy numbers to FFEN format', () => {
        let piece: PieceInfo = { type: "'7", color: 'b' };
        expect(pieceToFfenChar(piece)).toBe("'7");

        piece = { type: '7', color: 'b' };
        expect(pieceToFfenChar(piece)).toBe("'7");
        
        piece = { type: "''23", color: 'b' };
        expect(pieceToFfenChar(piece)).toBe("''23");
      });
    });

    describe('parseFen with FFEN support', () => {
      it('should parse standard FEN (6 blocks) as before', () => {
        const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        const position = parseFen(fen);
        expect(position).not.toBeNull();
        expect(countPieces(position?.pieces)).toBe(32);
      });

      it('should parse FFEN with neutral pieces', () => {
        const ffen = 'rnbqkbnr/pppppppp/8/3s4/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 d5:gn:Chamaleon';
        const position = parseFen(ffen);
        expect(position).not.toBeNull();
        expect(position?.pieces['d5']).toEqual(expect.objectContaining({
          fairyName: 'gn',
          fairyCondition: 'Chamaleon'
        }));
      });

      it('should parse FFEN with rotated pieces', () => {
        const ffen = 'rnbqkbnr/pppppppp/8/4s3/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 e5:(1,5)-leaper:None';
        const position = parseFen(ffen);
        expect(position).not.toBeNull();
        expect(position?.pieces['e5']).toEqual(expect.objectContaining({
          fairyName: '(1,5)-leaper',
          fairyCondition: 'None'
        }));
      });

      it('should return null for FFEN with invalid fairy metadata', () => {
        const ffen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 invalid:metadata';
        expect(parseFen(ffen)).toBeNull();
      });

      it('should return deafult  for wrong number of blocks', () => {
        // 8 blocks
        expect(parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 d5:gn:Test extra')).toBeNull();
      });

      it('should parse 6-block FFEN with neutral piece notation', () => {
        // 6 blocks but with FFEN extended notation (-K = neutral king)
        const ffen = '-Krnbqbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        const position = parseFen(ffen);
        expect(position).not.toBeNull();
        const neutralKing = position?.pieces['a8'];
        expect(neutralKing).toBeDefined();
        expect(neutralKing?.color).toBe('n');
        expect(neutralKing?.type).toBe('k');
      });

      it('should parse 6-block FFEN with rotated piece notation', () => {
        // 6 blocks but with *1R = white rook rotated 90 degrees (replaces the R on a1)
        const ffen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/*1RNBQKBNR w KQkq - 0 1';
        const position = parseFen(ffen);
        expect(position).not.toBeNull();
        const rotatedRook = position?.pieces['a1'];
        expect(rotatedRook).toBeDefined();
        expect(rotatedRook?.rotation).toBe('90');
        expect(rotatedRook?.type).toBe('r');
        expect(rotatedRook?.color).toBe('w');
      });

      it('should parse 6-block FFEN with fairy letter notation', () => {
        // 6 blocks but with 'a = fairy letter a (black), replaces R on a1
        const ffen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/'aNBQKBNR w KQkq - 0 1";
        const position = parseFen(ffen);
        expect(position).not.toBeNull();
        const fairyLetter = position?.pieces['a1'];
        expect(fairyLetter).toBeDefined();
        expect(fairyLetter?.type).toBe('\'a');
        expect(fairyLetter?.color).toBe('b');
      });

      it('should parse 6-block FFEN with double fairy letter notation', () => {
        // 6 blocks but with 'a = fairy letter a (black), replaces R on a1
        const ffen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/''gnNBQKBNR w KQkq - 0 1";
        const position = parseFen(ffen);
        expect(position).not.toBeNull();
        const fairyLetter = position?.pieces['a1'];
        expect(fairyLetter).toBeDefined();
        expect(fairyLetter?.type).toBe('\'\'gn');
        expect(fairyLetter?.color).toBe('b');
      });

      it("should parse very complicated FFEN: *2q7/'G'A'B'R'i'e'l'e/cxs2SCX/-c-x-s5/ETA5/KQRBNP2/eta'g'a'b2/kqrbnp2 w KQkq - 0 1 a8:GN:Imitator", () => {
        const ffen = "*2q7/'G'A'B'R'i'e'l'e/cxs2SCX/-c-x-s5/ETA5/KQRBNP2/eta'g'a'b2/kqrbnp2 w KQkq - 0 1 a8:GN:Imitator";
        const position = parseFen(ffen);
        expect(position).not.toBeNull();
        expect(countPieces(position?.pieces)).toBe(39);
      });


    });

    describe('positionToFFen', () => {
      it('should generate a proper FFEN string and not JSON', () => {
        const position: FenPosition = {
          pieces: {
            'e4': { type: 'q', color: 'w', fairyName: 'gn', fairyCondition: 'Chameleon' },
            'e8': { type: 'k', color: 'b' }
          },
          activeColor: 'w',
          castlingRights: '-',
          enPassantTarget: '-',
          halfmoveClock: 0,
          fullmoveNumber: 1,
          boardSize: { width: 8, height: 8 }
        };

        const ffen = positionToFen(position);
        expect(ffen).toContain('4k3/8/8/8/4Q3/8/8/8');
        expect(ffen).toContain(' e4:gn:Chameleon');
        expect(ffen).not.toContain('{');
        expect(ffen).not.toContain('"square"');
      });
    });

    describe('positionToFen with FFEN support', () => {
      it('should generate FEN for position without fairy metadata', () => {
        const position: FenPosition = {
          pieces: {
            'e1': { type: 'k', color: 'w' },
            'e8': { type: 'k', color: 'b' }
          },
          activeColor: 'w',
          castlingRights: 'KQkq',
          enPassantTarget: '-',
          halfmoveClock: 0,
          fullmoveNumber: 1,
          boardSize: { width: 8, height: 8 }
        };

        const fen = positionToFen(position);
        expect(fen).toBe('4k3/8/8/8/8/8/8/4K3 w KQkq - 0 1');
      });

      it('should generate FFEN for position with fairy metadata', () => {
        const position: FenPosition = {
          pieces: {
            'e1': { type: 'k', color: 'w' },
            'e8': { type: 'k', color: 'b' },
            'd5': { type: 's', color: 'n', rotation: "180", fairyName: 'gn', fairyCondition: 'Chameleon' }
          },
          activeColor: 'w',
          castlingRights: 'KQkq',
          enPassantTarget: '-',
          halfmoveClock: 0,
          fullmoveNumber: 1,
          boardSize: { width: 8, height: 8 }
        };

        const ffen = positionToFen(position);
        expect(ffen).toBe('4k3/8/8/3*2-S4/8/8/8/4K3 w KQkq - 0 1 d5:gn:Chameleon');
      });

      it('should generate FFEN piece placement for neutral pieces', () => {
        const position: FenPosition = {
          pieces: {
            'e1': { type: 'k', color: 'n' },
            'e8': { type: 'k', color: 'b' }
          },
          activeColor: 'w',
          castlingRights: '-',
          enPassantTarget: '-',
          halfmoveClock: 0,
          fullmoveNumber: 1,
          boardSize: { width: 8, height: 8 }
        };

        const ffen = positionToFen(position);
        // Neutral king: per FFEN spec case does not matter for neutral pieces, '-K' or '-k' both valid
        expect(ffen).toMatch(/-[Kk]/);
        // Should be parseable back as FFEN
        const reparsed = parseFen(ffen);
        expect(reparsed).not.toBeNull();
        const neutralKing = reparsed?.pieces['e1'];
        expect(neutralKing?.color).toBe('n');
      });

      it('should generate FFEN piece placement for rotated pieces', () => {
        const position: FenPosition = {
          pieces: {
            'e1': { type: 'q', color: 'w', rotation: "90" },
            'e8': { type: 'k', color: 'b' }
          },
          activeColor: 'w',
          castlingRights: '-',
          enPassantTarget: '-',
          halfmoveClock: 0,
          fullmoveNumber: 1,
          boardSize: { width: 8, height: 8 }
        };

        const ffen = positionToFen(position);
        // Rotated queen should be serialized with '*1' prefix
        expect(ffen).toContain('*1Q');
        // Should be parseable back as FFEN
        const reparsed = parseFen(ffen);
        expect(reparsed).not.toBeNull();
        const rotatedQueen = reparsed?.pieces['e1'];
        expect(rotatedQueen?.rotation).toBe("90");
      });

      it('should round-trip FFEN with neutral pieces and fairy metadata', () => {
        const original = '-Krnbqbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 a1:(1,5)-leaper:None';
        const position = parseFen(original);
        expect(position).not.toBeNull();
        const serialized = positionToFen(position!);
        // Re-parse the serialized form
        const reparsed = parseFen(serialized);
        expect(reparsed).not.toBeNull();
        // Neutral king on a8 should survive round-trip
        const neutralKing = reparsed?.pieces['a8'];
        expect(neutralKing?.color).toBe('n');
        // Fairy metadata should survive round-trip
        expect(reparsed?.pieces['a1']).toEqual(expect.objectContaining({ fairyName: '(1,5)-leaper', fairyCondition: 'None' }));
      });

      it('should round-trip FFEN with neutral pieces and fairy metadata', () => {
        const original = '-Krnbqbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 e5:(1,5)-leaper:,a1::Chamaleon,h8:gn:Imitator';
        const position = parseFen(original);
        expect(position).not.toBeNull();
        const serialized = positionToFen(position!);
        // Re-parse the serialized form
        const reparsed = parseFen(serialized);
        expect(reparsed).not.toBeNull();
        // Neutral king on a8 should survive round-trip
        const neutralKing = reparsed?.pieces['a8'];
        expect(neutralKing?.color).toBe('n');
        // Fairy metadata should survive round-trip
        expect(reparsed?.pieces['e5']).toBeUndefined(); // e5 has no piece, so no fairy metadata
        expect(reparsed?.pieces['a1']).toEqual(expect.objectContaining({ fairyCondition: 'Chamaleon' }));
        expect(reparsed?.pieces['h8']).toEqual(expect.objectContaining({ fairyName: 'gn', fairyCondition: 'Imitator' }));
      });
    });
  });
});
