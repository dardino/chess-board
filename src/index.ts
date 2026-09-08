export { ChessBoard, type CellClickEventDetail, type FenChangeEventDetail } from './ChessBoard/ChessBoard';
export { ChessPiece } from './ChessPiece/ChessPiece';
export * from './Common/Types';
export * from './Utilities/fen';
import { name, version } from '../package.json' with { type: 'json' };
export function chessBoardVersion(): string {
  return `Package Name: ${name} version: ${version}`;
}
