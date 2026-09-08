import { ChessPiece, isSamePiece } from "../ChessPiece/ChessPiece";
import { FairySquare } from "../Common/Types";
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
  
  const sizeHasChanged = boardContainer.childElementCount !== width * height;
  if (!sizeHasChanged) return;
  // Remove excess cells if any
  while (boardContainer.childElementCount > width * height) {
    boardContainer.removeChild(boardContainer.lastChild!);
  }
  
  // Add missing cells
  for (let i = boardContainer.childElementCount; i < width * height; i++) {
    const cell = document.createElement('div');
    cell.classList.add('square');
    boardContainer.appendChild(cell);
  }

  // recolor existing cells based on their position
  const allCells = boardContainer.querySelectorAll('.square');
  for (let i = 0; i < allCells.length; i++) {
    const cell = allCells[i] as HTMLElement;
    const row = Math.floor(i / width);
    const col = i % width;
    const isDark = (row + col) % 2 === 1;
    cell.classList.remove('dark', 'light');
    cell.classList.add(isDark ? 'dark' : 'light');
    const file = String.fromCharCode(97 + col);
    const rank = String(height - row);
    cell.setAttribute('data-coordinate', `${file}${rank}`);
  }

}

export function syncPiecesToCell(position: FenPosition, boardContainer: HTMLElement | null): void {
  if (!boardContainer) return;

  const allCells = boardContainer.querySelectorAll('.square');
  allCells.forEach(cell => {
    const coordinate = cell.getAttribute('data-coordinate') as FairySquare;
    if (!coordinate) return;
    const piece = position.pieces[coordinate];
    const existingElement = cell.querySelector<ChessPiece>('chess-piece');
    const existingPiece = existingElement?.toPieceInfo();
    if (isSamePiece(existingPiece, piece)) return;

    if (!piece) {
      cell.innerHTML = '';
      return;
    }

    if (existingElement) {
      // Update the element in place instead of recreating it, so DOM references
      // taken before a state change (e.g. via querySelector) stay valid after render.
      if (existingElement.getPiece() !== piece.type || existingElement.getColor() !== piece.color) {
        existingElement.setPiece(piece.type, piece.color);
      }
      const rotation = piece.rotation ?? '0';
      if (existingElement.getRotation() !== rotation) existingElement.setRotation(rotation);
      const fairyName = piece.fairyName ?? '';
      if (existingElement.getFairyName() !== fairyName) existingElement.setFairyName(fairyName);
      const fairyCondition = piece.fairyCondition ?? '';
      if (existingElement.getFairyCondition() !== fairyCondition) existingElement.setFairyCondition(fairyCondition);
      return;
    }

    const pieceElement = document.createElement('chess-piece');
    pieceElement.classList.add('piece');
    pieceElement.setPiece(piece.type, piece.color);
    if (piece.fairyName) pieceElement.setFairyName(piece.fairyName);
    if (piece.fairyCondition) pieceElement.setFairyCondition(piece.fairyCondition);
    if (piece.rotation) pieceElement.setRotation(piece.rotation);
    cell.appendChild(pieceElement);
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
