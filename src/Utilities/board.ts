import { FairySquare, Square } from "../Common/Types";
import { FenPosition } from "./fen";

/**
 * Validates if a coordinate is valid (a1-h8)
 * @param coordinate - Square coordinate to validate
 * @returns True if valid, false otherwise
 */
export function isValidCoordinate(coordinate: string, boardSize: FenPosition['boardSize']): coordinate is Square {
  if (!coordinate || coordinate.length !== 2) return false;
  const file = coordinate[0];
  const rank = coordinate[1];
  const maxLetter = String.fromCharCode('a'.charCodeAt(0) + boardSize.width - 1);
  const maxRank = String(boardSize.height);
  return file >= 'a' && file <= maxLetter && rank >= '1' && rank <= maxRank;
}

/**
 * Validates if a coordinate is a valid fairy square (a1-h8, i9-k11)
 * @param coordinate - Fairy square coordinate to validate
 * @returns True if valid, false otherwise
 */
export function isValidFairyCoordinate(coordinate: string): coordinate is FairySquare {
  if (!coordinate) return false;
  const file = coordinate[0];
  const rank = parseInt(coordinate.slice(1), 10);
  return (file >= 'a' && file <= 'k') && (rank >= 1 && rank <= 11);
}

/**
 * Generates all board squares for a given number of files and ranks.
 * @param files - Number of files (columns) on the board
 * @param ranks - Number of ranks (rows) on the board
 * @returns Array of square coordinates
 */
export function getAllBoardSquares(files: number, ranks: number): Square[] {
  const squares: Square[] = [];
  for (let rank = 1; rank <= ranks; rank++) {
    for (let file = 0; file < files; file++) {
      const fileChar = String.fromCharCode('a'.charCodeAt(0) + file);
      const square = `${fileChar}${rank}` as Square;
      squares.push(square);
    }
  }
  return squares;
}
