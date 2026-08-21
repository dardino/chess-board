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
  /** Optional: Fairy piece name (FFEN only) */
  fairyName?: string;
  /** Optional: Fairy piece condition (FFEN only) */
  fairyCondition?: string;
  /** Optional: Rotation in increments of 45° (0.5=45°, 1=90°, 1.5=135°, 2=180°, 2.5=225°, 3=270°, 3.5=315°) (FFEN only) */
  rotation?: number;
  /** Optional: Is this a neutral piece? (FFEN only) */
  isNeutral?: boolean;
}

/**
 * Represents fairy piece metadata in FFEN
 */
export interface FairyPieceMetadata {
  /** Fairy piece name */
  fairyName: string;
  /** Fairy piece condition */
  fairyCondition: string;
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
  /** Optional: Fairy piece metadata (FFEN only, 7th block) */
  fairyMetadata?: Record<string, FairyPieceMetadata>;
}

/**
 * Converts a FEN string to a structured position object
 * Supports both standard FEN (6 blocks) and FFEN (up to 7 blocks with fairy metadata)
 * @param fen - The FEN string to parse
 * @returns Parsed FEN position or null if invalid
 */
export function parseFen(fen: string): FenPosition | null {
  if (!fen || typeof fen !== 'string') {
    return null;
  }

  const parts = fen.trim().split(/\s+/);
  
  // Support both standard FEN (6 blocks) and FFEN (6+ blocks)
  if (parts.length < 6 || parts.length > 7) {
    return null;
  }

  // FFEN if there is a 7th block OR if the piece placement contains extended FFEN notation
  const isFfen = parts.length === 7 || /[-*']/.test(parts[0]);

  const [piecePlacement, activeColor, castlingRights, enPassantTarget, halfmoveClockStr, fullmoveNumberStr] = parts;
  const fairyMetadataBlock = parts[6]; // Optional 7th block for FFEN

  // Parse piece placement (pass isFfen flag)
  const pieces = parsePiecePlacement(piecePlacement, isFfen);
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

  // Parse fairy metadata if present (7th block in FFEN)
  let fairyMetadata: Record<string, FairyPieceMetadata> | undefined;
  if (fairyMetadataBlock) {
    fairyMetadata = parseFairyMetadata(fairyMetadataBlock);
    if (!fairyMetadata) {
      return null;
    }
  }

  return {
    pieces,
    activeColor: activeColor as 'w' | 'b',
    castlingRights,
    enPassantTarget,
    halfmoveClock,
    fullmoveNumber,
    fairyMetadata
  };
}

/**
 * Converts a structured position object to a FEN string
 * Generates FFEN format (with 7th block) if fairyMetadata is present
 * @param position - The position to convert
 * @returns FEN or FFEN string representation
 */
export function positionToFen(position: FenPosition): string {
  const piecePlacement = piecesToFenString(position.pieces);
  const fenParts = [
    piecePlacement,
    position.activeColor,
    position.castlingRights,
    position.enPassantTarget,
    position.halfmoveClock.toString(),
    position.fullmoveNumber.toString()
  ];

  // Add fairy metadata block if present
  if (position.fairyMetadata && Object.keys(position.fairyMetadata).length > 0) {
    const fairyBlockParts: string[] = [];
    for (const [cell, metadata] of Object.entries(position.fairyMetadata)) {
      fairyBlockParts.push(`${cell}:${metadata.fairyName}:${metadata.fairyCondition}`);
    }
    fenParts.push(fairyBlockParts.join(','));
  }

  return fenParts.join(' ');
}

/**
 * Parses the piece placement part of FEN/FFEN and returns array of pieces
 * @param piecePlacement - The piece placement string (e.g., "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")
 * @param isFfen - If true, parse FFEN format with extensions (default: false for standard FEN)
 * @returns Array of pieces or null if invalid
 */
export function parsePiecePlacement(piecePlacement: string, isFfen: boolean = false): ChessPiece[] | null {
  const ranks = piecePlacement.split('/');
  
  // Support variable board size for FFEN, but require 8 for standard FEN
  if (!isFfen && ranks.length !== 8) {
    return null;
  }
  
  if (isFfen && (ranks.length < 4 || ranks.length > 11)) {
    // Support 4x4 to 11x11 boards for FFEN
    return null;
  }

  const pieces: ChessPiece[] = [];
  const boardHeight = ranks.length;
  const boardWidth = 8; // Standard chess board width
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  for (let rank = 0; rank < boardHeight; rank++) {
    const rankStr = ranks[rank];
    let fileIndex = 0;
    let i = 0;

    while (i < rankStr.length) {
      const char = rankStr[i];

      if (char >= '1' && char <= '8') {
        // Empty squares (standard notation)
        const emptyCount = parseInt(char, 10);
        fileIndex += emptyCount;
        i++;
      } else {
        // Piece - may be multi-character in FFEN (e.g., "*1K", "-B", etc.)
        let pieceStr = '';
        
        if (isFfen) {
          // For FFEN, parse extended piece notation
          // A piece can start with '-', '*', or '
          // Or be a single character for standard pieces
          
          if (char === '-' || char === '*' || char === "'") {
            // Extended piece notation
            pieceStr = char;
            i++;
            
            // Parse rotation if present (*N)
            if (pieceStr === '*') {
              // Collect digits and decimal point for rotation
              let rotStr = '';
              while (i < rankStr.length && (rankStr[i] >= '0' && rankStr[i] <= '9' || rankStr[i] === '.')) {
                rotStr += rankStr[i];
                i++;
              }
              pieceStr += rotStr;
              
              // Next character should be the piece
              if (i < rankStr.length) {
                pieceStr += rankStr[i];
                i++;
              }
            } else if (pieceStr === '-') {
              // After '-', we can have '*' for rotation, or a piece directly
              if (i < rankStr.length && rankStr[i] === '*') {
                pieceStr += rankStr[i];
                i++;
                
                // Collect rotation value
                let rotStr = '';
                while (i < rankStr.length && (rankStr[i] >= '0' && rankStr[i] <= '9' || rankStr[i] === '.')) {
                  rotStr += rankStr[i];
                  i++;
                }
                pieceStr += rotStr;
              }
              
              // Next character is the piece
              if (i < rankStr.length) {
                pieceStr += rankStr[i];
                i++;
              }
            } else if (pieceStr === "'") {
              // Letter or number
              if (i < rankStr.length && rankStr[i] === "'") {
                // Double apostrophe for 2-digit number
                pieceStr += rankStr[i];
                i++;
                
                // Collect digits
                while (i < rankStr.length && rankStr[i] >= '0' && rankStr[i] <= '9') {
                  pieceStr += rankStr[i];
                  i++;
                }
              } else {
                // Single apostrophe for 1-digit number or letter
                if (i < rankStr.length) {
                  pieceStr += rankStr[i];
                  i++;
                }
              }
            }
          } else {
            // Standard single-character piece
            pieceStr = char;
            i++;
          }

          if (!pieceStr) {
            return null;
          }

          const parsedPiece = parseFfenPieceChar(pieceStr);
          if (!parsedPiece) {
            return null; // Invalid piece character
          }

          const square = files[fileIndex] + (boardHeight - rank).toString();
          pieces.push({
            type: parsedPiece.type as ChessPieceType,
            color: parsedPiece.color as ChessPieceColor | 'n',
            square,
            isNeutral: parsedPiece.isNeutral,
            rotation: parsedPiece.rotation
          });
          fileIndex++;
        } else {
          // Standard FEN - single character pieces
          pieceStr = char;
          const piece = parsePieceChar(pieceStr);
          if (!piece) {
            return null; // Invalid piece character
          }

          const square = files[fileIndex] + (8 - rank).toString();
          pieces.push({
            ...piece,
            square
          });
          fileIndex++;
          i++;
        }
      }

      if (fileIndex > boardWidth) {
        return null; // Too many squares in rank
      }
    }

    if (fileIndex !== boardWidth) {
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
 * Parses a single piece character (standard FEN only)
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
 * Parses a FFEN piece character which may include extensions:
 * - Neutral pieces: -K, -q
 * - Rotations: *N (0.5, 1, 1.5, 2, 2.5, 3, 3.5)
 * - Letters: 'a, 'A (black only)
 * - Numbers: '7, ''23 (black only)
 * - Markers: C, X, S, T (circle, cross, square, triangle)
 * 
 * @param pieceStr - Piece string from FFEN (e.g., 'K', '*1K', '-B', '*2q', 'C', etc.)
 * @returns Extended piece object or null if invalid
 */
export function parseFfenPieceChar(pieceStr: string): { 
  type: ChessPieceType | string; 
  color: ChessPieceColor | 'n'; 
  isNeutral: boolean;
  rotation?: number;
} | null {
  if (!pieceStr || pieceStr.length === 0) {
    return null;
  }

  let currentStr = pieceStr;
  let isNeutral = false;
  let rotation: number | undefined;

  // Parse neutral prefix: -
  if (currentStr.startsWith('-')) {
    isNeutral = true;
    currentStr = currentStr.substring(1);
  }

  // Parse rotation prefix: *N
  if (currentStr.startsWith('*')) {
    const rotationMatch = currentStr.match(/^\*(\d+(?:\.\d+)?)/);
    if (rotationMatch) {
      const rotValue = parseFloat(rotationMatch[1]);
      // Valid rotations: 0.5, 1, 1.5, 2, 2.5, 3, 3.5
      if (![0.5, 1, 1.5, 2, 2.5, 3, 3.5].includes(rotValue)) {
        return null;
      }
      rotation = rotValue;
      currentStr = currentStr.substring(rotationMatch[0].length);
    } else {
      return null;
    }
  }

  if (currentStr.length === 0) {
    return null;
  }

  const firstChar = currentStr[0];

  // Parse letters and numbers: ' or '' prefix (black only)
  if (firstChar === "'") {
    // Handle double apostrophe for 2+ digit numbers
    if (currentStr.startsWith("''")) {
      if (currentStr.length < 3) {
        return null;
      }
      const numberPart = currentStr.substring(2);
      if (!/^\d+$/.test(numberPart)) {
        return null;
      }
      return {
        type: numberPart,
        color: 'b',
        isNeutral,
        rotation
      };
    } else {
      // Single apostrophe for 1-digit number or letter
      if (currentStr.length < 2) {
        return null;
      }
      const afterApostrophe = currentStr.substring(1);
      // Could be a letter (single char) or a number (1 digit)
      return {
        type: afterApostrophe,
        color: 'b',
        isNeutral,
        rotation
      };
    }
  }

  // Standard pieces: K, Q, R, B, N, P, or markers: C, X, S, T
  if (currentStr.length !== 1) {
    return null;
  }

  const lowerChar = currentStr.toLowerCase();
  const validPieces: string[] = ['k', 'q', 'r', 'b', 'n', 'p', 'c', 'x', 's', 't'];

  if (!validPieces.includes(lowerChar)) {
    return null;
  }

  const color: ChessPieceColor | 'n' = isNeutral ? 'n' : (currentStr === lowerChar ? 'b' : 'w');

  return {
    type: lowerChar as ChessPieceType | string,
    color,
    isNeutral,
    rotation
  };
}

/**
 * Parses fairy metadata from the 7th FFEN block
 * Format: cell:fairypiece:fairycondition followed by cell:fairypiece:fairycondition...
 * Entries are identified by the cell pattern [a-z]\d+: at the start
 * Note: fairypiece and fairycondition cannot contain spaces or colons
 * @param fairyBlock - The fairy metadata block string
 * @returns Record mapping cell coordinates to fairy metadata, or undefined if invalid or empty
 */
export function parseFairyMetadata(fairyBlock: string): Record<string, FairyPieceMetadata> | undefined {
  if (!fairyBlock || fairyBlock.trim() === '') {
    return undefined;
  }

  const fairyMetadata: Record<string, FairyPieceMetadata> = {};
  
  // Split by cell pattern: match positions where we have [a-z]\d+:
  // Use a regex to find all cell positions
  const cellPattern = /[a-z]\d+:/g;
  const matches: Array<{ index: number; text: string }> = [];
  let match;
  while ((match = cellPattern.exec(fairyBlock)) !== null) {
    matches.push({ index: match.index, text: match[0] });
  }

  if (matches.length === 0) {
    return undefined;
  }

  for (let i = 0; i < matches.length; i++) {
    const currentMatch = matches[i];
    const nextMatch = i + 1 < matches.length ? matches[i + 1] : null;
    
    // Extract the cell and the rest of the entry
    const cellWithColon = currentMatch.text; // e.g., "e5:"
    const cell = cellWithColon.substring(0, cellWithColon.length - 1); // remove trailing ':'
    
    // Extract from after cell: to before the next cell (or end of string)
    const entryStart = currentMatch.index + cellWithColon.length;
    const entryEnd = nextMatch ? nextMatch.index : fairyBlock.length;
    const entryContent = fairyBlock.substring(entryStart, entryEnd);
    
    // Parse entryContent as "fairyName:fairyCondition"
    // Split on first colon only
    const colonIndex = entryContent.indexOf(':');
    if (colonIndex === -1) {
      return undefined;
    }
    
    const fairyName = entryContent.substring(0, colonIndex);
    let fairyCondition = entryContent.substring(colonIndex + 1);
    
    // Clean up trailing comma or whitespace from fairyCondition
    fairyCondition = fairyCondition.replace(/,\s*$/, '').trim();
    
    // Validate cell format (should already be validated by regex)
    if (!cell || !fairyName || !fairyCondition) {
      return undefined;
    }

    // Fairy names and conditions must not contain spaces or colons
    if (fairyName.includes(' ') || fairyName.includes(':')) {
      return undefined;
    }
    if (fairyCondition.includes(' ') || fairyCondition.includes(':')) {
      return undefined;
    }

    fairyMetadata[cell] = {
      fairyName,
      fairyCondition
    };
  }

  return Object.keys(fairyMetadata).length > 0 ? fairyMetadata : undefined;
}

/**
 * Converts a FFEN piece object to a FFEN character string
 * Handles neutral pieces, rotations, letters, numbers, and markers
 * @param piece - Piece object with optional FFEN extensions
 * @returns FFEN character string (e.g., 'K', '*1B', '-q', '*2.5r')
 */
export function pieceToFfenChar(piece: ChessPiece): string {
  let result = '';

  // Add neutral prefix if neutral
  if (piece.isNeutral) {
    result += '-';
  }

  // Add rotation prefix if present
  if (piece.rotation !== undefined) {
    result += `*${piece.rotation}`;
  }

  // Standard piece types
  const standardPieces = ['k', 'q', 'r', 'b', 'n', 'p', 'c', 'x', 's', 't'];
  const isStandardPiece = standardPieces.includes((piece.type as string).toLowerCase());

  // Handle different piece types
  if (piece.color === 'b') {
    // Black pieces and letters/numbers
    if (isStandardPiece) {
      // Regular black piece or marker
      result += (piece.type as string).toLowerCase();
    } else {
      // Fairy letter or number
      if (/^\d+$/.test(piece.type as string)) {
        // Number: use '' for multi-digit, ' for single digit
        if ((piece.type as string).length === 1) {
          result += `'${piece.type}`;
        } else {
          result += `''${piece.type}`;
        }
      } else {
        // Letter
        result += `'${piece.type}`;
      }
    }
  } else if (piece.color === 'w') {
    // White piece or marker
    result += (piece.type as string).toUpperCase();
  } else {
    // Neutral piece (should have been prefixed with -)
    result += (piece.type as string).toUpperCase();
  }

  return result;
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
