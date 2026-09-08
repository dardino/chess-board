
export type ChessPieceType = StandardPieces | `${number}` | `'${string}` | `''${string}`;
export type ChessPieceColor = 'w' | 'b' | 'n';
export type ChessPieceRotation = '0' | '45' | '90' | '135' | '180' | '225' | '270' | '315';

/**
 * List of standard chess pieces
 */
export const StandardPiecesList = [
  'k', 'q', 'r', 'b', 'n', 'p', 'e', 't', 'a', 'x', 's', 'c'
] as const;
export type StandardPieces = typeof StandardPiecesList[number];
export const StandardPieceEnum = Object.freeze(StandardPiecesList.reduce((acc, piece) => {
  acc[piece] = piece;
  return acc;
}, {} as Record<string, string>)) as { readonly [K in StandardPieces]: K };

/**
 * Represents fairy piece metadata in FFEN
 */
export type FairyPieceMetadata = {
  /** Fairy piece name */
  fairyName?: string;
  /** Fairy piece condition */
  fairyCondition?: string;
}

/**
 * Represents basic information about a chess piece
 */
export interface PieceInfo extends FairyPieceMetadata {
  type: ChessPieceType;
  color: ChessPieceColor;
  rotation?: ChessPieceRotation;
}

export type File = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';
export type Rank = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';
export type Square = `${File}${Rank}`;

export type FairyFile = File | 'i' | 'j' | 'k';
export type FairyRank = Rank | '9' | '10' | '11';
export type FairySquare = `${FairyFile}${FairyRank}`;

export type PiecesOnBoard = Partial<Record<FairySquare, PieceInfo | null>>

export interface PieceInfoWithSquare extends PieceInfo {
  square: Square;
}

export interface CellDecorator {
  backgroundColor: string;
  innerBorder: string;
}
