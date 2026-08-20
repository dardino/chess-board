/**
 * Forsyth-Edwards Notation (FEN) utilities for chess board
 *
 * FEN is a standard notation for describing a particular board position of a chess game.
 * The purpose of FEN is to provide all the necessary information to restart a game from a particular position.
 *
 * FEN format: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
 * - Piece placement (ranks 8 to 1)
 * - Active color (w or b)
 * - Castling availability (KQkq or -)
 * - En passant target square (- or square like e3)
 * - Halfmove clock (number of halfmoves since last capture or pawn advance)
 * - Fullmove number (incremented after black's move)
 */

import type { ChessPieceType, ChessPieceColor } from './ChessPiece';

/**
 * Represents a chess piece on the board
 */
export interface ChessPiece {
  /** Piece type: 'k' (king), 'q' (queen), 'r' (rook), 'b' (bishop), 'n' (knight), 'p' (pawn) */
  type: ChessPieceType;
  /** Piece color: 'w' (white) or 'b' (black) */
  color: ChessPieceColor;
  /** Square coordinate in algebraic notation (e.g., 'e4', 'a1') */
  square: string;
}

/**
 * Represents a complete FEN position
 */
export interface FenPosition {
  /** List of pieces on the board */
  pieces: ChessPiece[];
  /** Active color: 'w' for white, 'b' for black */
  activeColor: 'w' | 'b';
  /** Castling rights: combination of 'K', 'Q', 'k', 'q', or '-' for none */
  castlingRights: string;
  /** En passant target square in algebraic notation, or '-' if none */
  enPassantTarget: string;
  /** Number of halfmoves since last capture or pawn advance */
  halfmoveClock: number;
  /** Fullmove number (increments after black's move) */
  fullmoveNumber: number;
}

/**
 * Converts a FEN string to a structured position object
 * @param fen - The FEN string to parse
 * @returns Parsed FEN position or null if invalid
 */
export function parseFen(fen: string): FenPosition | null {
  if (!fen || typeof fen !== 'string') {
    return null;
  }

  const parts = fen.trim().split(/\s+/);
  if (parts.length !== 6) {
    return null;
  }

  const [piecePlacement, activeColor, castlingRights, enPassantTarget, halfmoveClockStr, fullmoveNumberStr] = parts;

  // Parse piece placement
  const pieces = parsePiecePlacement(piecePlacement);
  if (!pieces) {
    return null;
  }

  // Parse active color
  if (activeColor !== 'w' && activeColor !== 'b') {
    return null;
  }

  // Parse castling rights
  if (!isValidCastlingRights(castlingRights)) {
    return null;
  }

  // Parse en passant target
  if (!isValidEnPassantTarget(enPassantTarget)) {
    return null;
  }

  // Parse halfmove clock
  const halfmoveClock = parseInt(halfmoveClockStr, 10);
  if (isNaN(halfmoveClock) || halfmoveClock < 0) {
    return null;
  }

  // Parse fullmove number
  const fullmoveNumber = parseInt(fullmoveNumberStr, 10);
  if (isNaN(fullmoveNumber) || fullmoveNumber < 1) {
    return null;
  }

  return {
    pieces,
    activeColor: activeColor as 'w' | 'b',
    castlingRights,
    enPassantTarget,
    halfmoveClock,
    fullmoveNumber
  };
}

/**
 * Converts a structured position object to a FEN string
 * @param position - The position to convert
 * @returns FEN string representation
 */
export function positionToFen(position: FenPosition): string {
  const piecePlacement = piecesToFenString(position.pieces);
  return [
    piecePlacement,
    position.activeColor,
    position.castlingRights,
    position.enPassantTarget,
    position.halfmoveClock.toString(),
    position.fullmoveNumber.toString()
  ].join(' ');
}

/**
 * Parses the piece placement part of FEN and returns array of pieces
 * @param piecePlacement - The piece placement string (e.g., "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")
 * @returns Array of pieces or null if invalid
 */
export function parsePiecePlacement(piecePlacement: string): ChessPiece[] | null {
  const ranks = piecePlacement.split('/');
  if (ranks.length !== 8) {
    return null;
  }

  const pieces: ChessPiece[] = [];
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  for (let rank = 0; rank < 8; rank++) {
    const rankStr = ranks[rank];
    let fileIndex = 0;

    for (let i = 0; i < rankStr.length; i++) {
      const char = rankStr[i];

      if (char >= '1' && char <= '8') {
        // Empty squares
        const emptyCount = parseInt(char, 10);
        fileIndex += emptyCount;
      } else {
        // Piece
        const piece = parsePieceChar(char);
        if (!piece) {
          return null; // Invalid piece character
        }

        const square = files[fileIndex] + (8 - rank).toString();
        pieces.push({
          ...piece,
          square
        });
        fileIndex++;
      }

      if (fileIndex > 8) {
        return null; // Too many squares in rank
      }
    }

    if (fileIndex !== 8) {
      return null; // Not enough squares in rank
    }
  }

  return pieces;
}

/**
 * Converts an array of pieces back to FEN piece placement string
 * @param pieces - Array of pieces on the board
 * @returns FEN piece placement string
 */
export function piecesToFenString(pieces: ChessPiece[]): string {
  const board: (ChessPiece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  // Place pieces on board
  for (const piece of pieces) {
    const file = files.indexOf(piece.square[0]);
    const rank = 8 - parseInt(piece.square[1], 10);
    if (file >= 0 && rank >= 0 && rank < 8) {
      board[rank][file] = piece;
    }
  }

  // Convert to FEN ranks
  const ranks: string[] = [];
  for (let rank = 0; rank < 8; rank++) {
    let rankStr = '';
    let emptyCount = 0;

    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file];
      if (piece) {
        if (emptyCount > 0) {
          rankStr += emptyCount.toString();
          emptyCount = 0;
        }
        rankStr += pieceToChar(piece);
      } else {
        emptyCount++;
      }
    }

    if (emptyCount > 0) {
      rankStr += emptyCount.toString();
    }

    ranks.push(rankStr);
  }

  return ranks.join('/');
}

/**
 * Parses a single piece character and returns piece type and color
 * @param char - Piece character (e.g., 'K', 'q', 'P')
 * @returns Piece object or null if invalid
 */
export function parsePieceChar(char: string): { type: ChessPieceType; color: ChessPieceColor } | null {
  if (char.length !== 1) {
    return null;
  }

  const lowerChar = char.toLowerCase();
  const validPieces: ChessPieceType[] = ['k', 'q', 'r', 'b', 'n', 'p'];

  if (!validPieces.includes(lowerChar as ChessPieceType)) {
    return null;
  }

  return {
    type: lowerChar as ChessPieceType,
    color: char === lowerChar ? 'b' : 'w'
  };
}

/**
 * Converts a piece object to FEN character
 * @param piece - Piece object
 * @returns FEN character (e.g., 'K', 'q', 'P')
 */
export function pieceToChar(piece: ChessPiece): string {
  const char = piece.type.toUpperCase();
  return piece.color === 'w' ? char : char.toLowerCase();
}

/**
 * Validates castling rights string
 * @param castlingRights - Castling rights string
 * @returns True if valid
 */
function isValidCastlingRights(castlingRights: string): boolean {
  if (castlingRights === '-') {
    return true;
  }

  if (castlingRights.length > 4) {
    return false;
  }

  const validChars = ['K', 'Q', 'k', 'q'];
  for (const char of castlingRights) {
    if (!validChars.includes(char)) {
      return false;
    }
  }

  // Check for duplicates
  return new Set(castlingRights).size === castlingRights.length;
}

/**
 * Validates en passant target square
 * @param enPassantTarget - En passant target square
 * @returns True if valid
 */
function isValidEnPassantTarget(enPassantTarget: string): boolean {
  if (enPassantTarget === '-') {
    return true;
  }

  if (enPassantTarget.length !== 2) {
    return false;
  }

  const file = enPassantTarget[0];
  const rank = enPassantTarget[1];

  return file >= 'a' && file <= 'h' && (rank === '3' || rank === '6');
}

/**
 * Creates a standard starting position FEN
 * @returns Starting position FEN string
 */
export function getStartingPositionFen(): string {
  return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
}

/**
 * Creates an empty board position FEN
 * @returns Empty board FEN string
 */
export function getEmptyBoardFen(): string {
  return '8/8/8/8/8/8/8/8 w - - 0 1';
}
