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

import { ChessPieceColor, ChessPieceRotation, ChessPieceType, FairyPieceMetadata, FairySquare, PieceInfo, PiecesOnBoard, StandardPieces, StandardPiecesList } from "../Common/Types";

/**
 * Represents a complete FEN position
 */
export interface FenPosition {
  /** List of pieces on the board */
  pieces: PiecesOnBoard;
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
  /** Board size for FFEN (optional, defaults to 8x8) */
  boardSize: { width: number; height: number };
}

export const StartingPosition: FenPosition = {
  pieces: {},
  activeColor: 'w',
  castlingRights: 'KQkq',
  enPassantTarget: '-',
  halfmoveClock: 0,
  fullmoveNumber: 1,
  boardSize: { width: 8, height: 8 }
};

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

  // add missing blocks with defaults if necessary
  if (parts.length === 1) parts.push('w'); // Active color
  if (parts.length === 2) parts.push('KQkq'); // Castling rights
  if (parts.length === 3) parts.push('-'); // En passant target
  if (parts.length === 4) parts.push('0'); // Halfmove clock
  if (parts.length === 5) parts.push('1'); // Fullmove number

  if (parts.length > 7) {
    return null; // Invalid FEN: too many blocks
  }

  const [piecePlacement, activeColor, castlingRights, enPassantTarget, halfmoveClockStr, fullmoveNumberStr] = parts;
  const fairyMetadataBlock = parts[6]; // Optional 7th block for FFEN

  // Parse piece placement (pass isFfen flag)
  const parsed = parsePiecePlacement(piecePlacement);
  if (!parsed) return null;
  const { boardSize, pieces } = parsed;
  // supports board sizes between 4x4 and 11x11 for FFEN
  if (boardSize.width < 4 || boardSize.width > 11 || boardSize.height < 4 || boardSize.height > 11) {
    return null;
  }
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
      console.warn("Invalid fairy metadata block in FFEN!");
      return null;
    } else {
      // Assign fairy metadata to pieces if applicable
      for (const square of Object.keys(pieces) as FairySquare[]) {
        const piece = pieces[square];
        const metadata = fairyMetadata[square];
        if (piece && metadata) {
          piece.fairyName = metadata.fairyName;
          piece.fairyCondition = metadata.fairyCondition;
        }
      }
    }
  }

  return {
    pieces,
    activeColor: activeColor as 'w' | 'b',
    castlingRights,
    enPassantTarget,
    halfmoveClock,
    fullmoveNumber,
    boardSize
  };
}

/**
 * Converts a structured position object to a FEN string
 * Generates FFEN format (with 7th block) if at least one fairy piece is present
 * @param position - The position to convert
 * @returns FEN or FFEN string representation
 */
export function positionToFen(position: FenPosition): string {
  const boardSize = position.boardSize ?? { width: 8, height: 8 };
  const isFfen =
    (Object.values(position.pieces)).some(
      (p) => p?.color === 'n' || p?.rotation !== undefined || p?.fairyName !== undefined || p?.fairyCondition !== undefined
    );
  const piecePlacement = piecesToFenString(position.pieces, isFfen, boardSize);
  const fenParts = [
    piecePlacement,
    position.activeColor,
    position.castlingRights,
    position.enPassantTarget,
    position.halfmoveClock.toString(),
    position.fullmoveNumber.toString()
  ];

  // Add fairy metadata block if present
  const fairySourceBlock = Object.entries(position.pieces)
    .map(([square, p]) => (p?.fairyName || p?.fairyCondition) 
      ? `${square}:${p?.fairyName || ''}:${p?.fairyCondition || ''}` 
      : null)
    .filter(item => item !== null);

  if (fairySourceBlock && fairySourceBlock.length > 0) {
    fenParts.push(fairySourceBlock.join(','));
  }

  return fenParts.join(' ');
}

const RankRx = /(?<piece>(?<rotation>\*(?<degree>[0-3](?:\.[5])?))?(?<figure>(?<neutral>-)?(?<letter>[kqrbnpetacxs]|'\w|''\w\w)))|(?<emptyspaces>[0-9])/giy;

/**
 * Parses the piece placement part of FEN/FFEN and returns array of pieces
 * @param piecePlacement - The piece placement string (e.g., "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")
 * @param isFfen - If true, parse FFEN format with extensions (default: false for standard FEN)
 * @returns Array of pieces or null if invalid
 */
export function parsePiecePlacement(piecePlacement: string): { 
  pieces: PiecesOnBoard, 
  boardSize: { width: number, height: number }
} | null {
  if (!piecePlacement || typeof piecePlacement !== 'string') {
    console.warn("Invalid piece placement string");
    return null;
  }
  const ranks = piecePlacement.split('/');

  const pieces: PiecesOnBoard = {};
  const boardHeight = ranks.length;
  let boardWidth = 0; // Standard chess board width is equal to height, but FFEN can be rectangular

  for (let rank = 0; rank < boardHeight; rank++) {
    const rankStr = ranks[rank];
    let currentFile = 0;
    let matches: RegExpExecArray | null;
    RankRx.lastIndex = 0; // Reset regex state before parsing each rank
    while (null !== (matches = RankRx.exec(rankStr))) {
      const fileChar = matches.groups?.figure || matches.groups?.emptyspaces;
      if (!fileChar) continue;      
      if (/^[0-9]$/.test(fileChar)) {
        currentFile += parseInt(fileChar, 10);
        continue; // Skip empty spaces
      }
      const file = currentFile;
      const square = (String.fromCharCode(97 + file) + (boardHeight - rank).toString()) as FairySquare; // 'a' + file, rank from bottom
      const info: PieceInfo = {
        type: matches.groups?.letter.toLowerCase() as ChessPieceType,
        color: matches.groups?.letter === matches.groups?.letter?.toLowerCase() ? 'b' : 'w',
      };
      if (matches.groups?.neutral === '-') {
        info.color = 'n';
      }
      if (matches.groups?.rotation)
        info.rotation = (parseFloat(matches.groups?.degree ?? "0") * 90).toString() as ChessPieceRotation;
      pieces[square] = info;
      currentFile++;
    }
    if (currentFile !== boardWidth && boardWidth !== 0) {
      console.warn(`Invalid rank length in FFEN: expected ${boardWidth}, got ${currentFile}.`);
      return null; // Invalid rank length
    }
    boardWidth = Math.max(boardWidth, currentFile);
  }

  if (boardWidth < 4 || boardWidth > 11 || boardHeight < 4 || boardHeight > 11) {
    console.warn(`Invalid board size for FFEN: ${boardWidth}x${boardHeight}. Must be between 4x4 and 11x11.`);
    return null; // Invalid board size for FFEN
  }

  return { pieces, boardSize: { width: boardWidth, height: boardHeight } };
}

/**
 * Converts an array of pieces back to FEN piece placement string
 * @param pieces - Array of pieces on the board
 * @param isFfen - If true, use FFEN extended serialization (neutral pieces, rotations, fairy types)
 * @returns FEN piece placement string
 */
export function piecesToFenString(pieces: PiecesOnBoard, isFfen: boolean = false, boardSize: { width: number; height: number } = { width: 8, height: 8 }): string {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'].slice(0, boardSize.width);

  // Convert to FEN ranks
  const ranks: string[] = [];
  for (let rank = 0; rank < boardSize.height; rank++) {
    let rankStr = '';
    let emptyCount = 0;
    for (let file = 0; file < boardSize.width; file++) {
      const square = `${files[file]}${boardSize.height - rank}` as FairySquare;      
      const piece = pieces[square] ?? null;
      if (piece) {
        if (emptyCount > 0) {
          rankStr += emptyCount.toString();
          emptyCount = 0;
        }
        rankStr += isFfen ? pieceToFfenChar(piece) : pieceToChar(piece);
      } else {
        emptyCount++;
        // manage big fairy chessboard
        if (emptyCount === 8) {
          rankStr += '8';
          emptyCount = 0;
        }
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
  type: ChessPieceType; 
  color: ChessPieceColor | 'n'; 
  isNeutral: boolean;
  rotation?: number;
  fairyName?: string;
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
        type: 'a',
        color: 'b',
        isNeutral,
        rotation,
        fairyName: numberPart
      };
    } else {
      // Single apostrophe for 1-digit number or letter
      if (currentStr.length < 2) {
        return null;
      }
      const afterApostrophe = currentStr.substring(1);
      // Could be a letter (single char) or a number (1 digit)
      return {
        type: 'a',
        color: 'b',
        isNeutral,
        rotation,
        fairyName: afterApostrophe
      };
    }
  }

  // Standard pieces: K, Q, R, B, N, P, E, T, A or markers: C, X, S
  if (currentStr.length !== 1) {
    return null;
  }

  const lowerChar = currentStr.toLowerCase();

  if (!StandardPiecesList.includes(lowerChar as typeof StandardPiecesList[number])) {
    return null;
  }

  const color: ChessPieceColor | 'n' = isNeutral ? 'n' : (currentStr === lowerChar ? 'b' : 'w');

  return {
    type: lowerChar as ChessPieceType,
    color,
    isNeutral,
    rotation
  };
}

const FairyMetadataRegex = /(?<cell>[a-z][0-9]):(?<fairypiece>[^:]*)?:(?<condition>[^,]*)?/gi;
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
  if (fairyBlock.includes(' ')) {
    console.error("Fairy metadata block contains spaces, which is invalid");
    return undefined;
  }
  if (!/^[a-z][0-9]:[^:]*:[^,]*(,[a-z][0-9]:[^:]*:[^,]*)*$/.test(fairyBlock)) {
    console.error("Fairy metadata block has an invalid format");
    return undefined;
  }
  const fairyMetadata: Record<string, FairyPieceMetadata> = {};
  let matches: RegExpExecArray | null;
  FairyMetadataRegex.lastIndex = 0; // Reset regex state before parsing
  while (null !== (matches = FairyMetadataRegex.exec(fairyBlock))) {
    const cell = matches?.groups?.['cell'];
    if (!cell) {
      console.error("Invalid fairy metadata block");
      return undefined;
    }
    const fairyName = matches?.groups?.fairypiece;
    const fairyCondition = matches?.groups?.condition;
    if (fairyCondition?.includes(':')) {
      console.error("Fairy condition cannot contain colons");
      return undefined;
    }
    fairyMetadata[cell] = {};
    if (fairyName) fairyMetadata[cell].fairyName = fairyName;
    if (fairyCondition) fairyMetadata[cell].fairyCondition = fairyCondition;
  }
   // every 3 entries should be cell, fairypiece, fairycondition
  return Object.keys(fairyMetadata).length > 0 ? fairyMetadata : undefined;

}

/**
 * Converts a FFEN piece object to a FFEN character string
 * Handles neutral pieces, rotations, letters, numbers, and markers
 * @param piece - Piece object with optional FFEN extensions
 * @returns FFEN character string (e.g., 'K', '*1B', '-q', '*2.5r')
 */
export function pieceToFfenChar(piece: PieceInfo): string {
  let result = '';

  // Add rotation prefix if present
  if (piece.rotation !== undefined) {
    result += `*${(parseInt(piece.rotation ?? "0") / 90)}`;
  }

  if (!piece.type) {
    throw new Error("Piece type is required for FFEN serialization.");
  }

  // adjust piece.type for fairy letters and numbers
  if (!StandardPiecesList.includes(piece.type as StandardPieces)) {
    // For fairy letters and numbers, ensure they are prefixed with apostrophe
    let pieceType = piece.type.replace(/^'*/, ''); // Remove any leading apostrophes
    if (pieceType.length === 1) {
      piece.type = `'${pieceType}`; // Ensure it is prefixed with a single apostrophe
    }
    else {
      pieceType = pieceType.slice(0, 2); // Keep only first two characters for multi-character fairy types
      piece.type = `''${pieceType}`; // For multi-character fairy types, use double apostrophe
    }
  }

  // Add neutral prefix if neutral
  result += ((piece.color === 'n') ? "-" : "") + piece.type;

  // Set Case by color
  if (piece.color === 'b') {
    result = result.toLowerCase();
  } else {
    // White piece or marker
    result = result.toUpperCase();
  }

  return result;
}

/**
 * Converts a piece object to FEN character
 * @param piece - Piece object
 * @returns FEN character (e.g., 'K', 'q', 'P')
 */
export function pieceToChar(piece: PieceInfo): string {
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
