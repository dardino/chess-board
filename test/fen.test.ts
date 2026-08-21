import { describe, it, expect } from 'vitest';
import {
  parseFen,
  positionToFen,
  parsePiecePlacement,
  piecesToFenString,
  parsePieceChar,
  pieceToChar,
  getStartingPositionFen,
  getEmptyBoardFen,
  parseFfenPieceChar,
  parseFairyMetadata,
  pieceToFfenChar,
  type ChessPiece,
  type FenPosition
} from '../src/fen';

describe('FEN Utilities', () => {
  describe('parsePieceChar', () => {
    it('should parse white king', () => {
      const result = parsePieceChar('K');
      expect(result).toEqual({ type: 'k', color: 'w' });
    });

    it('should parse black queen', () => {
      const result = parsePieceChar('q');
      expect(result).toEqual({ type: 'q', color: 'b' });
    });

    it('should parse white pawn', () => {
      const result = parsePieceChar('P');
      expect(result).toEqual({ type: 'p', color: 'w' });
    });

    it('should parse black rook', () => {
      const result = parsePieceChar('r');
      expect(result).toEqual({ type: 'r', color: 'b' });
    });

    it('should return null for invalid piece', () => {
      expect(parsePieceChar('X')).toBeNull();
      expect(parsePieceChar('')).toBeNull();
      expect(parsePieceChar('KK')).toBeNull();
    });
  });

  describe('pieceToChar', () => {
    it('should convert white king to K', () => {
      const piece: ChessPiece = { type: 'k', color: 'w', square: 'e1' };
      expect(pieceToChar(piece)).toBe('K');
    });

    it('should convert black queen to q', () => {
      const piece: ChessPiece = { type: 'q', color: 'b', square: 'd8' };
      expect(pieceToChar(piece)).toBe('q');
    });

    it('should convert white pawn to P', () => {
      const piece: ChessPiece = { type: 'p', color: 'w', square: 'e4' };
      expect(pieceToChar(piece)).toBe('P');
    });
  });

  describe('parsePiecePlacement', () => {
    it('should parse starting position piece placement', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
      const pieces = parsePiecePlacement(fen);

      expect(pieces).toHaveLength(32);

      // Check some specific pieces
      expect(pieces).toContainEqual({ type: 'r', color: 'b', square: 'a8' });
      expect(pieces).toContainEqual({ type: 'k', color: 'b', square: 'e8' });
      expect(pieces).toContainEqual({ type: 'p', color: 'b', square: 'a7' });
      expect(pieces).toContainEqual({ type: 'r', color: 'w', square: 'a1' });
      expect(pieces).toContainEqual({ type: 'k', color: 'w', square: 'e1' });
      expect(pieces).toContainEqual({ type: 'p', color: 'w', square: 'a2' });
    });

    it('should parse empty board', () => {
      const fen = '8/8/8/8/8/8/8/8';
      const pieces = parsePiecePlacement(fen);
      expect(pieces).toHaveLength(0);
    });

    it('should parse position with some pieces', () => {
      const fen = 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R';
      const pieces = parsePiecePlacement(fen);

      expect(pieces).toHaveLength(32);

      // Check specific positions
      expect(pieces).toContainEqual({ type: 'r', color: 'b', square: 'a8' });
      expect(pieces).toContainEqual({ type: 'n', color: 'b', square: 'c6' });
      expect(pieces).toContainEqual({ type: 'p', color: 'b', square: 'e5' });
      expect(pieces).toContainEqual({ type: 'p', color: 'w', square: 'e4' });
      expect(pieces).toContainEqual({ type: 'n', color: 'w', square: 'f3' });
    });

    it('should return null for invalid FEN', () => {
      expect(parsePiecePlacement('')).toBeNull();
      expect(parsePiecePlacement('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP')).toBeNull(); // Too few ranks
      expect(parsePiecePlacement('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR/extra')).toBeNull(); // Too many ranks
      expect(parsePiecePlacement('rnbqkbnr/pppppppp/9/8/8/8/PPPPPPPP/RNBQKBNR')).toBeNull(); // Invalid number in rank
    });
  });

  describe('piecesToFenString', () => {
    it('should convert pieces back to FEN string', () => {
      const pieces: ChessPiece[] = [
        { type: 'r', color: 'b', square: 'a8' },
        { type: 'n', color: 'b', square: 'b8' },
        { type: 'b', color: 'b', square: 'c8' },
        { type: 'q', color: 'b', square: 'd8' },
        { type: 'k', color: 'b', square: 'e8' },
        { type: 'b', color: 'b', square: 'f8' },
        { type: 'n', color: 'b', square: 'g8' },
        { type: 'r', color: 'b', square: 'h8' },
        // Add pawns
        { type: 'p', color: 'b', square: 'a7' },
        { type: 'p', color: 'b', square: 'b7' },
        { type: 'p', color: 'b', square: 'c7' },
        { type: 'p', color: 'b', square: 'd7' },
        { type: 'p', color: 'b', square: 'e7' },
        { type: 'p', color: 'b', square: 'f7' },
        { type: 'p', color: 'b', square: 'g7' },
        { type: 'p', color: 'b', square: 'h7' },
        // White pieces
        { type: 'p', color: 'w', square: 'a2' },
        { type: 'p', color: 'w', square: 'b2' },
        { type: 'p', color: 'w', square: 'c2' },
        { type: 'p', color: 'w', square: 'd2' },
        { type: 'p', color: 'w', square: 'e2' },
        { type: 'p', color: 'w', square: 'f2' },
        { type: 'p', color: 'w', square: 'g2' },
        { type: 'p', color: 'w', square: 'h2' },
        { type: 'r', color: 'w', square: 'a1' },
        { type: 'n', color: 'w', square: 'b1' },
        { type: 'b', color: 'w', square: 'c1' },
        { type: 'q', color: 'w', square: 'd1' },
        { type: 'k', color: 'w', square: 'e1' },
        { type: 'b', color: 'w', square: 'f1' },
        { type: 'n', color: 'w', square: 'g1' },
        { type: 'r', color: 'w', square: 'h1' }
      ];

      const fenString = piecesToFenString(pieces);
      expect(fenString).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
    });

    it('should handle empty board', () => {
      const pieces: ChessPiece[] = [];
      const fenString = piecesToFenString(pieces);
      expect(fenString).toBe('8/8/8/8/8/8/8/8');
    });

    it('should handle sparse pieces', () => {
      const pieces: ChessPiece[] = [
        { type: 'k', color: 'w', square: 'e1' },
        { type: 'k', color: 'b', square: 'e8' }
      ];
      const fenString = piecesToFenString(pieces);
      expect(fenString).toBe('4k3/8/8/8/8/8/8/4K3');
    });
  });

  describe('parseFen', () => {
    it('should parse complete starting position FEN', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const position = parseFen(fen);

      expect(position).not.toBeNull();
      expect(position?.pieces).toHaveLength(32);
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
      const position = {
        pieces: [
          { type: 'r' as const, color: 'b' as const, square: 'a8' },
          { type: 'k' as const, color: 'b' as const, square: 'e8' },
          { type: 'r' as const, color: 'w' as const, square: 'a1' },
          { type: 'k' as const, color: 'w' as const, square: 'e1' }
        ],
        activeColor: 'w' as const,
        castlingRights: 'KQkq',
        enPassantTarget: '-',
        halfmoveClock: 0,
        fullmoveNumber: 1
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
      expect(position?.pieces).toHaveLength(32);
    });
  });

  describe('getEmptyBoardFen', () => {
    it('should return an empty board position', () => {
      const fen = getEmptyBoardFen();
      expect(fen).toBe('8/8/8/8/8/8/8/8 w - - 0 1');

      // Verify it's parseable
      const position = parseFen(fen);
      expect(position).not.toBeNull();
      expect(position?.pieces).toHaveLength(0);
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
      const originalPieces: ChessPiece[] = [
        { type: 'k', color: 'w', square: 'e1' },
        { type: 'q', color: 'w', square: 'd1' },
        { type: 'k', color: 'b', square: 'e8' }
      ];

      const fenString = piecesToFenString(originalPieces);
      const parsedPieces = parsePiecePlacement(fenString);

      expect(parsedPieces).toHaveLength(3);
      expect(parsedPieces).toContainEqual(originalPieces[0]);
      expect(parsedPieces).toContainEqual(originalPieces[1]);
      expect(parsedPieces).toContainEqual(originalPieces[2]);
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
        const piece: ChessPiece = { type: 'k', color: 'n', square: 'e4', isNeutral: true };
        expect(pieceToFfenChar(piece)).toBe('-K');
      });

      it('should convert rotated pieces to FFEN format', () => {
        let piece: ChessPiece = { type: 'q', color: 'w', square: 'd1', rotation: 1 };
        expect(pieceToFfenChar(piece)).toBe('*1Q');
        
        piece = { type: 'r', color: 'b', square: 'a8', rotation: 2.5 };
        expect(pieceToFfenChar(piece)).toBe('*2.5r');
      });

      it('should convert fairy letters to FFEN format', () => {
        const piece: ChessPiece = { type: 'a', color: 'b', square: 'e4' };
        expect(pieceToFfenChar(piece)).toBe("'a");
      });

      it('should convert fairy numbers to FFEN format', () => {
        let piece: ChessPiece = { type: '7', color: 'b', square: 'e4' };
        expect(pieceToFfenChar(piece)).toBe("'7");
        
        piece = { type: '23', color: 'b', square: 'e4' };
        expect(pieceToFfenChar(piece)).toBe("''23");
      });
    });

    describe('parseFen with FFEN support', () => {
      it('should parse standard FEN (6 blocks) as before', () => {
        const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        const position = parseFen(fen);
        expect(position).not.toBeNull();
        expect(position?.pieces).toHaveLength(32);
        expect(position?.fairyMetadata).toBeUndefined();
      });

      it('should parse FFEN with neutral pieces', () => {
        const ffen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 d5:gn:Chamaleon';
        const position = parseFen(ffen);
        expect(position).not.toBeNull();
        expect(position?.fairyMetadata).toEqual({
          'd5': { fairyName: 'gn', fairyCondition: 'Chamaleon' }
        });
      });

      it('should parse FFEN with rotated pieces', () => {
        const ffen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 e5:(1,5)-leaper:None';
        const position = parseFen(ffen);
        expect(position).not.toBeNull();
        expect(position?.fairyMetadata).toEqual({
          'e5': { fairyName: '(1,5)-leaper', fairyCondition: 'None' }
        });
      });

      it('should return null for FFEN with invalid fairy metadata', () => {
        const ffen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 invalid:metadata';
        expect(parseFen(ffen)).toBeNull();
      });

      it('should return null for wrong number of blocks', () => {
        // 5 blocks
        expect(parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0')).toBeNull();
        // 8 blocks
        expect(parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 d5:gn:Test extra')).toBeNull();
      });
    });

    describe('positionToFen with FFEN support', () => {
      it('should generate FEN for position without fairy metadata', () => {
        const position: FenPosition = {
          pieces: [
            { type: 'k', color: 'w', square: 'e1' },
            { type: 'k', color: 'b', square: 'e8' }
          ],
          activeColor: 'w',
          castlingRights: 'KQkq',
          enPassantTarget: '-',
          halfmoveClock: 0,
          fullmoveNumber: 1
        };

        const fen = positionToFen(position);
        expect(fen).toBe('4k3/8/8/8/8/8/8/4K3 w KQkq - 0 1');
      });

      it('should generate FFEN for position with fairy metadata', () => {
        const position: FenPosition = {
          pieces: [
            { type: 'k', color: 'w', square: 'e1' },
            { type: 'k', color: 'b', square: 'e8' }
          ],
          activeColor: 'w',
          castlingRights: 'KQkq',
          enPassantTarget: '-',
          halfmoveClock: 0,
          fullmoveNumber: 1,
          fairyMetadata: {
            'd5': { fairyName: 'gn', fairyCondition: 'Chamaleon' }
          }
        };

        const ffen = positionToFen(position);
        expect(ffen).toBe('4k3/8/8/8/8/8/8/4K3 w KQkq - 0 1 d5:gn:Chamaleon');
      });
    });
  });
});
