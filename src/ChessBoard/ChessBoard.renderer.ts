import { ChessPiece } from "../ChessPiece/ChessPiece";
import { FairySquare, PieceInfo } from "../Common/Types";
import { FenPosition } from "../Utilities/fen";

export function getLabelElement(type: 'column' | 'row'): HTMLElement {
  const div = document.createElement('div');
  div.classList.add('label', type === 'column' ? 'column-label' : 'row-label');
  return div;
}

export function drawBoardLabels(total: number, topContainer: HTMLElement | null, bottomContainer: HTMLElement | null, direction: 'column' | 'row'): void {
  if (!topContainer || !bottomContainer) return;

  // Remove excess labels if any
  while (topContainer.childElementCount > total) {
    topContainer.removeChild(topContainer.lastChild!);
    bottomContainer.removeChild(bottomContainer.lastChild!);
  }

  // Add missing labels
  for (let i = topContainer.childElementCount; i < total; i++) {
    const topLabel = getLabelElement(direction);
    const bottomLabel = getLabelElement(direction);
    topContainer.appendChild(topLabel);
    bottomContainer.appendChild(bottomLabel);
  }

  // relabel the top and bottom labels
  for (let i = 0; i < total; i++) {
    const topLabel = topContainer.children[i] as HTMLElement;
    const bottomLabel = bottomContainer.children[i] as HTMLElement;
    const label: string = direction === 'column' ? String.fromCharCode(97 + i) : String(total - i);
    topLabel.textContent = label;
    bottomLabel.textContent = label;
  }
}

export function drawAllCells(width: number, height: number, boardContainer: HTMLElement | null): void {
  if (!boardContainer) return;
  const backgroundLayer = boardContainer.querySelector('.background') as HTMLElement | null;
  const piecesLayer = boardContainer.querySelector('.pieces') as HTMLElement | null;
  if (!backgroundLayer || !piecesLayer) return;
  
  const sizeHasChanged = boardContainer.childElementCount !== width * height;
  if (!sizeHasChanged) return;
  // Remove excess cells if any
  while (backgroundLayer.childElementCount > width * height) {
    backgroundLayer.removeChild(backgroundLayer.lastChild!);
  }
  while (piecesLayer.childElementCount > width * height) {
    piecesLayer.removeChild(piecesLayer.lastChild!);
  }
  
  // Add missing cells
  for (let i = backgroundLayer.childElementCount; i < width * height; i++) {
    const cell = document.createElement('div');
    cell.classList.add('square');
    backgroundLayer.appendChild(cell);
  }
  for (let i = piecesLayer.childElementCount; i < width * height; i++) {
    const cell = document.createElement('div');
    cell.classList.add('square');
    piecesLayer.appendChild(cell);
  }

  // recolor existing cells based on their position
  const allBgCells = backgroundLayer.querySelectorAll<HTMLElement>('.square');
  allBgCells.forEach((cell, i) => {
    const { row, col } = getCoordinateFromIndex(i, width, height);
    const isDark = (row + col) % 2 === 1;
    cell.classList.remove('dark', 'light');
    cell.classList.add(isDark ? 'dark' : 'light');
  });
  const allPCells = piecesLayer.querySelectorAll<HTMLElement>('.square');
  allPCells.forEach((cell, i) => {
    const { file, rank } = getCoordinateFromIndex(i, width, height);
    cell.setAttribute('data-file', file);
    cell.setAttribute('data-rank', rank);
    cell.setAttribute('data-coordinate', `${file}${rank}`);
  });
}

function getCoordinateFromIndex(index: number, width: number, height: number) {
  const row = Math.floor(index / width);
  const col = index % width;
  const file = String.fromCharCode(97 + col);
  const rank = String(height - row);
  return {
    /** The file (a-h) of the square */
    file,
    /** The rank (1-8) of the square */
    rank,
    /** The row (0-based) of the square */
    row,
    /** The column (0-based) of the square */
    col
  }
}

function updateOrCreatePieceAt(coordinate: FairySquare, piece: PieceInfo, boardContainer: HTMLElement): void {
  try {
    const rotation = piece.rotation ?? '0';
    const fairyName = piece.fairyName ?? '';
    const fairyCondition = piece.fairyCondition ?? '';
    let pieceElement = boardContainer.querySelector(`.square[data-coordinate="${coordinate}"]>chess-piece`) as ChessPiece | null;
    const isNew = !pieceElement;
    if (!pieceElement) {
      pieceElement = document.createElement('chess-piece');
    }
    pieceElement.setAttribute('data-file', coordinate[0]);
    pieceElement.setAttribute('data-rank', coordinate.slice(1));
    pieceElement.classList.add('piece');
    pieceElement.setPiece(piece.type, piece.color);
    if (fairyName) pieceElement.setFairyName(fairyName);
    else pieceElement.removeAttribute('data-fairy-name');
    if (fairyCondition) pieceElement.setFairyCondition(fairyCondition);
    else pieceElement.removeAttribute('data-fairy-condition');
    pieceElement.setRotation(rotation);
    if (isNew) {
      boardContainer.querySelector(`.square[data-coordinate="${coordinate}"]`)?.appendChild(pieceElement);
    }
  } catch (error) {
    console.error(error);
    console.error(`Failed to update or create piece at ${coordinate}:`, error);
  }

}

export function syncPiecesToCell(position: FenPosition, boardContainer: HTMLElement | null): void {
  if (!boardContainer) return;

  // update existing pieces (or create them if they do not exist)
  Object.entries(position.pieces).forEach(([coordinate, piece]) => {
    if (!piece) return;
    updateOrCreatePieceAt(coordinate as FairySquare, piece as PieceInfo, boardContainer);
  });

  // remove pieces that are no longer present in the current position
  const cellWithPieces = Object.keys(position.pieces);
  const allPieces = boardContainer.querySelectorAll('chess-piece');
  allPieces.forEach(pieceElement => {
    const coordinate = pieceElement.closest('.square')?.getAttribute('data-coordinate');
    if (!coordinate || cellWithPieces.includes(coordinate)) return;
    pieceElement.remove();
  });

}

export function setCurrentSquare(coordinate: string | null, boardContainer: HTMLElement | null): void {
  boardContainer?.querySelectorAll('.current').forEach(cell => cell.classList.remove('current'));
  boardContainer?.querySelector(`[data-coordinate="${coordinate}"]`)?.classList.add('current');
}

export function setCurrentSelectedPiece(coordinate: string | null, boardContainer: HTMLElement | null): void {
  boardContainer?.querySelectorAll('.selected-piece').forEach(cell => cell.classList.remove('selected-piece'));
  boardContainer?.querySelector(`.square[data-coordinate="${coordinate}"]`)?.classList.add('selected-piece');
}
