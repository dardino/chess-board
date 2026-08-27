export { ChessBoard, type CellClickEventDetail, type CellDecorator, type FenChangeEventDetail, type PieceInfo, type PieceInfoWithSquare, type Square } from './ChessBoard';
export { ChessPiece } from './ChessPiece';
export * from './fen';
import { name, version } from '../package.json' with { type: 'json' };
export function chessBoardVersion(): string {
  return `Package Name: ${name} version: ${version}`;
}
