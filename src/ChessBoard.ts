/**
 * ChessBoard Web Component
 * A custom element for displaying a chess board
 */
import style from './ChessBoard.css?raw';
import template from './ChessBoard.html?raw';
import { ChessPiece } from './ChessPiece';
import { FairyPieceMetadata, FenPosition, parseFen, positionToFen, type ChessPieceColor, type ChessPieceRotation, type ChessPieceType, type FENChessPiece as FenChessPiece } from './fen';

type ModifierKeys = Pick<MouseEvent, 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'>;
export interface PieceInfo {
  type: ChessPieceType;
  color: ChessPieceColor;
  fairyName?: string;
  fairyCondition?: string;
  rotation?: ChessPieceRotation;
}
export interface PieceInfoWithSquare extends PieceInfo {
  square: string;
}
export interface CellClickEventDetail {
  square: string;
  piece?: PieceInfo;
  button: "main" | "context" | "auxiliary";
}

const buttonMap: Record<number, "main" | "context" | "auxiliary"> = {
  0: "main",
  1: "auxiliary",
  2: "context"
};

export interface FenChangeEventDetail {
  fen: string;
}

// Augment DOM typings so addEventListener/removeEventListener recognize the custom 'cellClick' event
declare global {
  interface HTMLElementEventMap {
    cellMainClick: CustomEvent<CellClickEventDetail>;
    /**
     * @deprecated Use cellMainClick instead. This alias is kept for backward compatibility.
     */
    cellClick: CustomEvent<CellClickEventDetail>;
    cellContextClick: CustomEvent<CellClickEventDetail>;
    cellAuxiliaryClick: CustomEvent<CellClickEventDetail>;
    fenChange: CustomEvent<FenChangeEventDetail>;
  }
}

export type Square = string;


export interface CellDecorator {
  backgroundColor: string;
  innerBorder: string;
}

export class ChessBoard extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['fen', 'hide-labels', 'disabled'];
  }

  #shadow: ShadowRoot;
  #currentFen: string = '';

  #getBooleanAttribute(name: string): boolean {
    return this.hasAttribute(name) && this.getAttribute(name) !== 'false';
  }
  #setBooleanAttribute(name: string, value: boolean): void {
    if (value) {
      this.setAttribute(name, '');
    } else {
      this.removeAttribute(name);
    }
  }

  get #board(): HTMLElement | null {
    const board = this.#shadow.querySelector<HTMLElement>('.board');
    return board;
  }
  get #squares(): NodeListOf<HTMLElement> | null {
    const squares = this.#shadow.querySelectorAll<HTMLElement>('.square');
    return squares;
  }
  get disabled() {
    return this.#getBooleanAttribute('disabled');
  }
  set disabled(value: boolean) {
    this.#setBooleanAttribute('disabled', value);
  }
  get disablePieceSelection() {
    return this.#getBooleanAttribute('disable-piece-selection');
  }
  set disablePieceSelection(value: boolean) {
    this.#setBooleanAttribute('disable-piece-selection', value);
  }

  get disablePieceAddition() {
    return this.#getBooleanAttribute('disable-piece-addition');
  }
  set disablePieceAddition(value: boolean) {
    this.#setBooleanAttribute('disable-piece-addition', value);
  }
  
  get ignoreFenActiveColor() {
    return this.#getBooleanAttribute('ignore-fen-active-color');
  }
  set ignoreFenActiveColor(value: boolean) {
    this.#setBooleanAttribute('ignore-fen-active-color', value);
  }
  #currentSquare: string | null = null;
  #selectedPieceSquare: string | null = null;
  #cellDecorators: Partial<Record<Square, CellDecorator>> = {};

  // Auto-select piece on click attribute
  get autoSelectPieceOnClick(): boolean {
    return this.#getBooleanAttribute('auto-select-piece-on-click');
  }
  set autoSelectPieceOnClick(value: boolean) {
    this.#setBooleanAttribute('auto-select-piece-on-click', value);
  }

  //#region Private Helper Methods
  #checkModifiers = (event: KeyboardEvent): boolean => {
    return !event.altKey && !event.ctrlKey && !event.metaKey;
  };
  /**
   * Validates if a coordinate is valid (a1-h8)
   * @param coordinate - Square coordinate to validate
   * @returns True if valid, false otherwise
   */
  #isValidCoordinate(coordinate: string): boolean {
    if (!coordinate || coordinate.length !== 2) return false;
    const file = coordinate[0];
    const rank = coordinate[1];
    return file >= 'a' && file <= 'h' && rank >= '1' && rank <= '8';
  }
  //#endregion

  //#region Keyboard Navigation Handlers

  // Private keyboard handler properties (arrow functions for auto-binding)
  #handleArrowUp = (event: KeyboardEvent): void => {
    // Handle Shift+Up (flip to white)
    if (event.shiftKey) {
      this.#handleFlipToWhite(event);
      return;
    }
    // Handle Alt/Option+Up (rotate reset to 0°)
    if (event.altKey) {
      this.#handleRotateReset(event);
      return;
    }
    // Handle plain Up (navigate)
    const newSquare = this.#moveUp(this.#currentSquare!, this.hasAttribute('black-to-move'));
    if (newSquare) {
      event.preventDefault();
      this.#setCurrentSquare(newSquare);
    }
  };
  #handleArrowDown = (event: KeyboardEvent): void => {
    // Handle Shift+Down (flip to black)
    if (event.shiftKey) {
      this.#handleFlipToBlack(event);
      return;
    }
    // Handle Alt/Option+Down (rotate to 180°)
    if (event.altKey) {
      this.#handleRotate180(event);
      return;
    }
    // Handle plain Down (navigate)
    const newSquare = this.#moveDown(this.#currentSquare!, this.hasAttribute('black-to-move'));
    if (newSquare) {
      event.preventDefault();
      this.#setCurrentSquare(newSquare);
    }
  };
  #handleArrowLeft = (event: KeyboardEvent): void => {
    // Handle Alt/Option+Left (rotate counter-clockwise)
    if (event.altKey && !event.shiftKey) {
      this.#handleRotateCounterClockwise(event);
      return;
    }
    // Handle plain Left (navigate)
    const newSquare = this.#moveLeft(this.#currentSquare!);
    if (newSquare) {
      event.preventDefault();
      this.#setCurrentSquare(newSquare);
    }
  };
  #handleArrowRight = (event: KeyboardEvent): void => {
    // Handle Alt/Option+Right (rotate clockwise)
    if (event.altKey && !event.shiftKey) {
      this.#handleRotateClockwise(event);
      return;
    }
    // Handle plain Right (navigate)
    const newSquare = this.#moveRight(this.#currentSquare!);
    if (newSquare) {
      event.preventDefault();
      this.#setCurrentSquare(newSquare);
    }
  };
  #handleDelete = (event: KeyboardEvent): void => {
    if (!this.#checkModifiers(event)) return;
    this.#removePieceFromCurrentSquare();
    this.#clearSelectedPiece();
    this.#serializeBoardState(true);
    event.preventDefault();
  };
  #handleEscape = (event: KeyboardEvent): void => {
    if (!this.#checkModifiers(event)) return;
    // If a piece is selected, clear the selection
    if (this.#selectedPieceSquare !== null) {
      this.#clearSelectedPiece();
    } else if (event.shiftKey) {
      this.setStartingPosition();
    } else {
      this.clearBoard();
    }
    event.preventDefault();
  };

  #handleSelectPieceByKey = (event: KeyboardEvent): void => {
    event.preventDefault();
    if (event.metaKey || event.altKey) return;

    if (!this.#currentSquare) {
      return;
    }

    const currentSquareHasPiece = this.hasPiece(this.#currentSquare);
    const currentSelection = this.#selectedPieceSquare;

    // If the current square has a piece and no piece is selected, select the piece
    if (currentSquareHasPiece && !currentSelection) {
      this.#setSelectedPiece(this.#currentSquare);
      return;
    }
    // If the current square has a piece and a piece is already selected, toggle selection
    else if (currentSquareHasPiece && currentSelection === this.#currentSquare) {
      this.#clearSelectedPiece();
      return;
    }
    // If the current square does not have a piece and no piece is selected, do nothing
    if (!currentSelection) {
      return;
    }
    // else move the selected piece to the current square
    const mode = event.shiftKey ? "clone"
              : event.ctrlKey ? "changecolor"
              : "none";
    this.#movePiece(currentSelection, this.#currentSquare, mode);
  };
  
  #movePiece = (fromSquare: string, toSquare: string, cloneMode: "clone" | "changecolor" | "none"): void => {
    const piece = this.#getPieceAtSquare(fromSquare);
    if (piece) {
      if (cloneMode === "none") {
        // if not in clone mode, remove the piece from the original square
        this.#removePieceFromSquare(fromSquare);
      }
      this.#removePieceFromSquare(toSquare);
      if (cloneMode === "changecolor") {
        piece.color = piece.color === "w" ? "b" : "w";
      }
      this.#addPieceToSquare(toSquare, piece);
    }
    this.#clearSelectedPiece();
    this.#serializeBoardState(true);
  };

  #handleAddPiece = (pieceType: ChessPieceType, color: ChessPieceColor): (event: KeyboardEvent) => void => {
    return (event: KeyboardEvent) => {
      if (!this.#checkModifiers(event)) return;
      if (this.disablePieceAddition) return;
      this.#addPieceToSquare(this.#currentSquare!, {
        type: pieceType,
        color
      });
      this.#serializeBoardState(true);
      event.preventDefault();
    };
  };
  #handleRotateCounterClockwise = (event: KeyboardEvent): void => {
    this.#rotatePieceOnCurrentSquare(-45);
    event.preventDefault();
  };
  #handleRotateClockwise = (event: KeyboardEvent): void => {
    this.#rotatePieceOnCurrentSquare(45);
    event.preventDefault();
  };
  #handleRotateReset = (event: KeyboardEvent): void => {
    this.#setPieceRotationOnCurrentSquare(0);
    event.preventDefault();
  };
  #handleRotate180 = (event: KeyboardEvent): void => {
    this.#setPieceRotationOnCurrentSquare(180);
    event.preventDefault();
  };
  #handleFlipToWhite = (event: KeyboardEvent): void => {
    this.#setBoardOrientation('white');
    event.preventDefault();
  };
  #handleFlipToBlack = (event: KeyboardEvent): void => {
    this.#setBoardOrientation('black');
    event.preventDefault();
  };

  #keyboardHandlers: Record<string, (event: KeyboardEvent) => void> = {
    'ArrowUp': this.#handleArrowUp,
    'ArrowDown': this.#handleArrowDown,
    'ArrowLeft': this.#handleArrowLeft,
    'ArrowRight': this.#handleArrowRight,
    ' ': this.#handleSelectPieceByKey,
    'Spacebar': this.#handleSelectPieceByKey,
    'Enter': this.#handleSelectPieceByKey,
    'Delete': this.#handleDelete,
    'Backspace': this.#handleDelete,
    'Escape': this.#handleEscape,
    // Piece key handlers
    'p': this.#handleAddPiece('p', 'b'),
    'P': this.#handleAddPiece('p', 'w'),
    'r': this.#handleAddPiece('r', 'b'),
    'R': this.#handleAddPiece('r', 'w'),
    'n': this.#handleAddPiece('n', 'b'),
    'N': this.#handleAddPiece('n', 'w'),
    'b': this.#handleAddPiece('b', 'b'),
    'B': this.#handleAddPiece('b', 'w'),
    'q': this.#handleAddPiece('q', 'b'),
    'Q': this.#handleAddPiece('q', 'w'),
    'k': this.#handleAddPiece('k', 'b'),
    'K': this.#handleAddPiece('k', 'w'),
    // Fairy pieces
    'e': this.#handleAddPiece('e', 'b'),
    'E': this.#handleAddPiece('e', 'w'),
    't': this.#handleAddPiece('t', 'b'),
    'T': this.#handleAddPiece('t', 'w'),
    'a': this.#handleAddPiece('a', 'b'),
    'A': this.#handleAddPiece('a', 'w'),
    // Symbolic pieces
    'c': this.#handleAddPiece('c', 'b'),
    'C': this.#handleAddPiece('c', 'w'),
    's': this.#handleAddPiece('s', 'b'),
    'S': this.#handleAddPiece('s', 'w'),
    'x': this.#handleAddPiece('x', 'b'),
    'X': this.#handleAddPiece('x', 'w')
  };

  #handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.#currentSquare || this.disabled) return;

    // Handle regular keys (each handler checks its own modifiers)
    const handleToCall = this.#keyboardHandlers[event.key];
    if (typeof handleToCall === 'function') {
      handleToCall(event);
    }

    // If the key is not an arrow key, space, or escape, and no modifiers are pressed, clear the selected piece
    const isArrowNavigation = event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowRight';
    const isPureArrowNavigation = isArrowNavigation && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;    
    if (!isPureArrowNavigation 
        && event.key !== ' ' 
        && event.key !== 'Spacebar' 
        && event.key !== 'Enter'
        && event.key !== 'Escape'
        && event.key !== 'ContextMenu'
        && event.key !== 'Shift'
        && event.key !== 'Control'
        && event.key !== 'Alt'
        && event.key !== 'Meta'
      ) this.#clearSelectedPiece();
    
    this.#serializeBoardState(true);
  }
  //#endregion

  //#region Lifecycle Callbacks
  #firstRenderDone: boolean = false;
  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this.#firstRender();
    this.#updatePiecesFromFen();
    this.#updateBoardOrientationFromCurrentFen();
    this.#setupEventListeners();
  }

  disconnectedCallback(): void {
    this.#removeEventListeners();
  }
  
  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (oldValue !== newValue) {
      if (name === 'fen') {
        if (this.#currentFen === newValue) return; // No change, no need to update
        this.#currentFen = newValue || '';
        this.#updatePiecesFromFen();
      } else if (name === 'hide-labels') {
        this.#updateLabelsVisibility();
      }

      if (name === "disabled") {
        this.#updateDisabledState();
      }
    }
  }

  //#endregion

  //#region Private Methods
  
  #firstRender(): void {
    if (this.#firstRenderDone) return;
    this.#firstRenderDone = true;

    this.#shadow.innerHTML = ''; // Clear any existing content
    
    // Create container from imported HTML template
    const templateContainer = document.createElement('template');
    templateContainer.innerHTML = template;

    // Add styles
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(style);
    this.#shadow.adoptedStyleSheets = [sheet];

    this.#shadow.appendChild(templateContainer.content.cloneNode(true));

    // Update labels visibility based on attribute
    this.#updateLabelsVisibility();

    // Restore current square selection if it exists
    if (this.#currentSquare) {
      this.#setCurrentSquare(this.#currentSquare);
    }

  }

  #setupEventListeners(): void {    
    // Add keyboard navigation
    if (this.#board) {
      this.#board.addEventListener("click", this.#handleBoardClick);
      this.#board.addEventListener("contextmenu", this.#handleContextMenuClick);
      this.#board.addEventListener("auxclick", this.#handleBoardClick);
      this.#board.addEventListener('keydown', this.#handleKeyDown);
      this.#board.addEventListener('focus', this.#handleFocus);
      this.#board.addEventListener('blur', this.#handleBlur);
      this.#board.addEventListener('fairy-metadata-changed', this.#handleFairyMetadataChange);
    }
  }

  #removeEventListeners(): void {
    if (this.#board) {
      this.#board.removeEventListener("click", this.#handleBoardClick);
      this.#board.removeEventListener("auxclick", this.#handleBoardClick);
      this.#board.removeEventListener("contextmenu", this.#handleContextMenuClick);
      this.#board.removeEventListener('keydown', this.#handleKeyDown);
      this.#board.removeEventListener('focus', this.#handleFocus);
      this.#board.removeEventListener('blur', this.#handleBlur);
      this.#board.removeEventListener('fairy-metadata-changed', this.#handleFairyMetadataChange);
    }
  }

  #handleBoardClick = (ev: MouseEvent): void => {
    if (this.disabled) return;
    const button = buttonMap[ev.button];
    const target = ev.target as HTMLElement | null;
    const square = target?.closest('.square') as HTMLElement | null;
    if (!square) return;
    if (square.classList.contains('square')) {
      const prevent = this.#handleSquareClick(square, button, {
        shiftKey: ev.shiftKey,
        ctrlKey: ev.ctrlKey,
        altKey: ev.altKey,
        metaKey: ev.metaKey,
      });
      if (prevent) ev.preventDefault();
    }
  }

  #handleContextMenuClick = (ev: MouseEvent): void => {

    if (this.disabled) return;
    
    const target = ev.target as HTMLElement | null;
    const cell = target?.closest('.square') as ChessPiece | null;
    if (!cell) return;
    const square = cell.getAttribute('data-coordinate');
    if (!square) return;

    const piece = this.getPieceAt(square) ?? undefined;
    const customEvent = new CustomEvent('cellContextClick', {
      detail: {
        square,
        piece,
        button: "context",
      } satisfies CellClickEventDetail,
      bubbles: true,
      composed: true,
      cancelable: true
    });
    this.dispatchEvent(customEvent);
    if (customEvent.defaultPrevented) ev.preventDefault();

  }

  #moveOrSelectPieceByClick = (square: string, mods?: ModifierKeys): void => {
    mods = mods ?? {
      shiftKey: false,
      ctrlKey: false,
      altKey: false,
      metaKey: false,
    };
    // Set this square as current
    // If the square is already current, call SelectedPiece logic to toggle selection or move piece
    const alreadyCurrent = this.#currentSquare === square;
    if (alreadyCurrent) {
      this.selectPiece(square);
    } else {
      this.#setCurrentSquare(square);
      // check if a piece is selected and if so, move it to the clicked square
      if (this.#selectedPieceSquare !== square && this.#selectedPieceSquare) {
        const piece = this.getPieceAt(this.#selectedPieceSquare);
        if (!piece) return;
        if (mods.shiftKey) {
          this.#movePiece(this.#selectedPieceSquare, square, "clone");
        } else if (mods.ctrlKey) {
          this.#movePiece(this.#selectedPieceSquare, square, "changecolor");
        } else {
          this.#movePiece(this.#selectedPieceSquare, square, "none");
        }
      } else if (this.autoSelectPieceOnClick) {
        // else if auto-select is enabled, select the piece on the clicked square if it has one
        this.selectPiece(square);
      }
    }    
  }

  /**
   * Handles a click on a square.
   * @param square The HTML element of the square that was clicked.
   * @param button The mouse button used for the click ("main", "context", or "auxiliary").
   * @param mods The modifier keys pressed during the click.
   * @returns True if the click was handled or prevented, false otherwise.
   */
  #handleSquareClick(square: HTMLElement, button: "main" | "context" | "auxiliary", mods: ModifierKeys): boolean {
    const cell = square.getAttribute('data-coordinate');
    if (!cell) return false; // ensure the square has a valid coordinate

    const piece = this.getPieceAt(cell) ?? undefined;
    const eventNames = button === 'main'
      ? ['cellMainClick', 'cellClick']
      : ['cell' + button.charAt(0).toUpperCase() + button.slice(1) + 'Click'];

    let wasPrevented = false;
    for (const eventName of eventNames) {
      const customEvent = new CustomEvent(eventName, {
        detail: {
          square: cell,
          piece,
          button,
        } satisfies CellClickEventDetail,
        bubbles: true,
        composed: true,
        cancelable: true
      });

      this.dispatchEvent(customEvent);
      if (customEvent.defaultPrevented) {
        wasPrevented = true;
      }
    }

    // if custom event was prevented, do not proceed with selection or movement and prevent default behavior
    if (wasPrevented) return true;

    const actionToDo = this.#mouseActions[button];
    if (!actionToDo) return false; // if no action is defined for this mouse button, do nothing
    
    actionToDo(cell, mods);

    return true;
  }

  #handleFocus = (): void => {
    if (this.disabled) return;
    // If no current square is set, select a1
    if (!this.#currentSquare) {
      this.#setCurrentSquare('a1');
    }
  }

  #handleBlur = (): void => {
    this.#clearSelectedPiece();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  #handleFairyMetadataChange = (_ev: CustomEvent<FairyPieceMetadata>): void => {
    this.#serializeBoardState(true);
  }

  #updateDisabledState(): void {
    const isDisabled = this.hasAttribute('disabled');
    if (this.#board) {
      this.#board.style.pointerEvents = isDisabled ? 'none' : 'auto';
    }
  }

  #setCurrentSquare(coordinate: string): void {
    // Remove current class from all squares
    this.#squares?.forEach(square => {
      square.classList.remove('current');
    });

    // Add current class to the specified square
    const square = this.#shadow.querySelector(`[data-coordinate="${coordinate}"]`) as HTMLElement;
    if (square) {
      square.classList.add('current');
    }
    // Always set currentSquare, even if square element is not found yet
    this.#currentSquare = coordinate;
  }

  #updateSelectedPieceState(): void {
    this.#squares?.forEach(square => {
      const coordinate = square.getAttribute('data-coordinate');
      square.classList.toggle('selected-piece', coordinate === this.#selectedPieceSquare);
    });
  }

  #clearSelectedPiece(): void {
    this.#selectedPieceSquare = null;
    this.#updateSelectedPieceState();
  }

  #moveUp(current: string, isRotated: boolean): string | null {
    const file = current[0];
    const rank = parseInt(current[1]);
    
    if (isRotated) {
      // When rotated, "up" means decreasing rank (towards rank 1)
      return rank > 1 ? `${file}${rank - 1}` : null;
    } else {
      // Normal orientation: "up" means increasing rank (towards rank 8)
      return rank < 8 ? `${file}${rank + 1}` : null;
    }
  }

  #moveDown(current: string, isRotated: boolean): string | null {
    const file = current[0];
    const rank = parseInt(current[1]);
    
    if (isRotated) {
      // When rotated, "down" means increasing rank (towards rank 8)
      return rank < 8 ? `${file}${rank + 1}` : null;
    } else {
      // Normal orientation: "down" means decreasing rank (towards rank 1)
      return rank > 1 ? `${file}${rank - 1}` : null;
    }
  }

  #moveLeft(current: string): string | null {
    const file = current[0];
    const rank = current[1];
    const fileIndex = file.charCodeAt(0) - 'a'.charCodeAt(0);
    
    return fileIndex > 0 ? `${String.fromCharCode('a'.charCodeAt(0) + fileIndex - 1)}${rank}` : null;
  }

  #moveRight(current: string): string | null {
    const file = current[0];
    const rank = current[1];
    const fileIndex = file.charCodeAt(0) - 'a'.charCodeAt(0);
    
    return fileIndex < 7 ? `${String.fromCharCode('a'.charCodeAt(0) + fileIndex + 1)}${rank}` : null;
  }

  /**
   * Helper method to remove piece from a specific square
   * @param coordinate - Square coordinate (e.g., "e4", "a1")
   */
  #removePieceFromSquare = (coordinate: string): void => {
    const square = this.#shadow.querySelector(`[data-coordinate="${coordinate}"]`) as HTMLElement;
    if (!square) return;

    const piece = square.querySelector('chess-piece');
    if (piece) {
      square.removeChild(piece);
    }

    this.#clearSelectedPiece();
    this.#serializeBoardState(true);
  }

  #removePieceFromCurrentSquare(): void {
    if (!this.#currentSquare) return;
    this.#removePieceFromSquare(this.#currentSquare);
  }

  /**
   * Helper method to add or replace piece on a specific square
   * This method doesn't trigger FEN serialization, so you need to call 
   * #serializeBoardState(true) after calling this method if you want to update the FEN.
   * @param coordinate - Square coordinate (e.g., "e4", "a1")
   * @param pieceType - Type of piece to add
   * @param color - Color of piece
   * @param rotation - Optional rotation angle
   */
  #addPieceToSquare(coordinate: string, piece: PieceInfo): void {
    const square = this.#shadow.querySelector(`[data-coordinate="${coordinate}"]`) as HTMLElement;
    if (!square) return;

    // Remove existing piece if present
    const existingPiece = square.querySelector('chess-piece');
    if (existingPiece) {
      square.removeChild(existingPiece);
    }

    // Create and add new piece
    const newPiece = new ChessPiece();
    newPiece.setAttribute('piece', piece.type);
    newPiece.setAttribute('color', piece.color);
    newPiece.setAttribute('fairy-name', piece.fairyName || '');
    newPiece.setAttribute('fairy-condition', piece.fairyCondition || '');
    if (piece.rotation) {
      newPiece.setAttribute('rotation', piece.rotation);
    }
    newPiece.classList.add('piece');
    square.appendChild(newPiece);

    this.#clearSelectedPiece();
    this.#serializeBoardState(true);
  }

  /**
   * Helper method to rotate piece on a specific square by delta degrees
   * @param coordinate - Square coordinate (e.g., "e4", "a1")
   * @param delta - Rotation delta in degrees
   */
  #rotatePieceOnSquare(coordinate: string, delta: number): void {
    const square = this.#shadow.querySelector(`[data-coordinate="${coordinate}"]`) as HTMLElement;
    if (!square) return;

    const piece = square.querySelector('chess-piece') as ChessPiece;
    if (!piece) return;

    const currentRotation = parseInt(piece.getRotation() as string) || 0;
    let newRotation = (currentRotation + delta) % 360;
    
    // Normalize to positive angle
    if (newRotation < 0) newRotation += 360;
    
    // Round to nearest 45 degrees
    newRotation = Math.round(newRotation / 45) * 45;
    if (newRotation === 360) newRotation = 0;

    piece.setRotation(newRotation.toString() as ChessPieceRotation);
  }

  #rotatePieceOnCurrentSquare(delta: number): void {
    if (!this.#currentSquare) return;
    this.#rotatePieceOnSquare(this.#currentSquare, delta);
  }

  /**
   * Helper method to set absolute rotation on a specific square
   * @param coordinate - Square coordinate (e.g., "e4", "a1")
   * @param rotation - Rotation angle (0, 45, 90, 135, 180, 225, 270, 315)
   */
  #setPieceRotationOnSquare(coordinate: string, rotation: number): void {
    const square = this.#shadow.querySelector(`[data-coordinate="${coordinate}"]`) as HTMLElement;
    if (!square) return;

    const piece = square.querySelector('chess-piece') as ChessPiece;
    if (!piece) return;

    piece.setRotation(rotation.toString() as ChessPieceRotation);
  }

  #setPieceRotationOnCurrentSquare(rotation: number): void {
    if (!this.#currentSquare) return;
    this.#setPieceRotationOnSquare(this.#currentSquare, rotation);
  }

  /**
   * Helper method to get piece information at a specific square
   * @param coordinate - Square coordinate (e.g., "e4", "a1")
   * @returns Piece information or null if square is empty
   */
  #getPieceAtSquare(coordinate: string): PieceInfo | null {

    const square = this.#shadow.querySelector(`[data-coordinate="${coordinate}"]`) as HTMLElement;
    if (!square) return null;
    
    const piece = square.querySelector('chess-piece') as ChessPiece;
    if (!piece) return null;

    const pieceatsquare: PieceInfo = {
      type: piece.getPiece(),
      color: piece.getColor()
    };

    if (parseInt(piece.getRotation()) > 0) pieceatsquare.rotation = piece.getRotation();
    if (piece.getFairyName()) pieceatsquare.fairyName = piece.getFairyName();
    if (piece.getFairyCondition()) pieceatsquare.fairyCondition = piece.getFairyCondition();
    return pieceatsquare;
  }

  #setBoardOrientation(orientation: 'white' | 'black'): void {
    if (orientation === 'black') {
      this.setAttribute('black-to-move', '');
    } else {
      this.removeAttribute('black-to-move');
    }
  }

  #updateLabelsVisibility(): void {
    const hideLabels = this.hasAttribute('hide-labels');
    const labels = this.#shadow.querySelectorAll('.top-labels, .bottom-labels, .left-labels, .right-labels');

    labels.forEach(label => {
      if (hideLabels) {
        (label as HTMLElement).style.display = 'none';
      } else {
        (label as HTMLElement).style.display = '';
      }
    });
  }

  /**
   * Updates the cell decorators based on the current decorators map.
   */
  #updateCellDecorators(): void {
    const squares = this.#squares ?? [];
    squares.forEach((square) => {
      const coordinate = square.getAttribute('data-coordinate');
      const decorator = coordinate ? this.#cellDecorators[coordinate] : undefined;
      const existingDecorator = square.querySelector('.cell-decorator') as HTMLElement | null;

      if (!decorator) {
        if (existingDecorator) {
          existingDecorator.remove();
        }
        return;
      }

      const decoratorElement = existingDecorator ?? document.createElement('div') as HTMLElement;
      decoratorElement.classList.add('cell-decorator');
      decoratorElement.style.position = 'absolute';
      decoratorElement.style.inset = '0';
      decoratorElement.style.backgroundColor = decorator.backgroundColor;
      decoratorElement.style.border = decorator.innerBorder;
      decoratorElement.style.boxSizing = 'border-box';
      decoratorElement.style.zIndex = '0';
      decoratorElement.style.pointerEvents = 'none';

      if (!existingDecorator) {
        square.style.position = 'relative';
        const firstChild = square.firstChild;
        if (firstChild) {
          square.insertBefore(decoratorElement, firstChild);
        } else {
          square.appendChild(decoratorElement);
        }
      }
    });
  }

  /**
   * Sets the board orientation attribute
   * @param activeColor - 'w' for white to move, 'b' for black to move
   */
  #updateBoardOrientation(activeColor: 'w' | 'b'): void {
    if (activeColor === 'b') {
      this.setAttribute('black-to-move', '');
    } else {
      this.removeAttribute('black-to-move');
    }
  }

  #updateBoardOrientationFromCurrentFen(): void {
    if (this.ignoreFenActiveColor) return;
    const fenString = this.#currentFen;
    if (!fenString) {
      return;
    }

    const position = parseFen(fenString);
    if (position) {
      this.#updateBoardOrientation(position.activeColor);
    }
    
  }

  #updatePiecesFromFen(): void {
    // Clear existing pieces
    this.#clearPieces();

    const fenString = this.#currentFen;
    
    if (!fenString) {
      return;
    }

    // Parse FEN/FFEN and place pieces
    const position = parseFen(fenString);

    if (!position) {
      console.warn('Invalid FEN/FFEN string:', fenString);
      return;
    }

    // Update board orientation based on active color
    this.#updateBoardOrientationFromCurrentFen();

    // Place each piece on the board
    for (const piece of position.pieces) {
      this.#placePiece(piece);
    }
  }

  #clearPieces(): void {
    const squares = this.#shadow.querySelectorAll('.square');
    squares.forEach(square => {
      const existingPiece = square.querySelector('.piece');
      if (existingPiece) {
        square.removeChild(existingPiece);
      }
    });
  }

  /**
   * Applies a decorator layer to selected cells.
   * Decorators render as an internal overlay immediately above the cell background and below all other content.
   * @param decoratorsMap - Map of square coordinate to decorator definition
   */
  setCellDecorators(decoratorsMap: Record<Square, CellDecorator>): void {
    for (const square of Object.keys(decoratorsMap)) {
      if (!this.#isValidCoordinate(square)) {
        throw new Error(`Invalid square coordinate: ${square}. Must be a valid square from a1 to h8.`);
      }
    }

    this.#cellDecorators = { ...decoratorsMap };
    this.#updateCellDecorators();
  }

  #placePiece(piece: FenChessPiece): void {
    const square = this.#shadow.querySelector(`[data-coordinate="${piece.square}"]`) as HTMLElement;
    if (!square) {
      console.warn('Square not found for coordinate:', piece.square);
      return;
    }

    // Create chess piece element
    const pieceElement = new ChessPiece();
    pieceElement.setAttribute('piece', piece.type);
    pieceElement.setAttribute('color', piece.color);
    if (piece.fairyName) pieceElement.setAttribute('fairy-name', piece.fairyName);
    if (piece.fairyCondition) pieceElement.setAttribute('fairy-condition', piece.fairyCondition);
    if (piece.rotation) pieceElement.setAttribute('rotation', piece.rotation);
    pieceElement.classList.add('piece');

    // Add piece to square
    square.appendChild(pieceElement);
  }

  #serializeBoardState(triggerChange: boolean): void {
    const oldFen = this.#currentFen;

    const position: FenPosition = {
      pieces: this.getAllPieces().map(piece => ({
        type: piece.type,
        color: piece.color,
        fairyCondition: piece.fairyCondition,
        fairyName: piece.fairyName,
        rotation: piece.rotation,
        square: piece.square,
        isNeutral: piece.color === 'n' ? true : undefined
      })),
      activeColor: this.hasAttribute('black-to-move') ? 'b' : 'w',
      castlingRights: '-',
      enPassantTarget: '-',
      halfmoveClock: 0,
      fullmoveNumber: 1
    };

    const newFen = positionToFen(position);
    if (oldFen !== newFen) {
      this.#currentFen = newFen;
      this.setAttribute('fen', this.#currentFen);
      if (triggerChange) this.#triggerFenChangeEvent();
    }
  }

  #iseventqueued = false;
  #triggerFenChangeEvent(): void {
    // Prevent multiple events from being queued simultaneously
    if (this.#iseventqueued) return;
    // Prevent dispatching if the FEN hasn't really changed
    // if (this.#lastDispatchedFen === this.#currentFen) return;
    this.#iseventqueued = true;
    queueMicrotask(() => {
      this.#iseventqueued = false;
      this.dispatchEvent(new CustomEvent('fenChange', {
        detail: { fen: this.#currentFen } satisfies FenChangeEventDetail,
        bubbles: true,
        composed: true
      }));
    });
  }

  /**
   * toggles the selection of a piece on the board. 
   * If a piece is present on the specified square, it becomes selected; 
   * if the square is empty, any existing selection is cleared.
   * @param coordinate - Square coordinate (e.g., "e4", "a1")
   * @returns True if the piece was selected, false if the square is empty
   */
  #setSelectedPiece(coordinate: string): boolean {
    if (this.disablePieceSelection) return false;
    if (!this.#isValidCoordinate(coordinate)) {
      throw new Error(`Invalid square coordinate: ${coordinate}`);
    }

    this.#setCurrentSquare(coordinate);
    let returnValue: boolean = false;

    if (!this.hasPiece(coordinate)) {
      this.#clearSelectedPiece();
    } else  if (this.#selectedPieceSquare === coordinate) {
      this.#clearSelectedPiece();
    } else {
      this.#selectedPieceSquare = coordinate;
      returnValue = true;
    }

    this.#updateSelectedPieceState();
    return returnValue;
  }

  #mouseActions: Record<"main" | "context" | "auxiliary", (square: string, mods?: ModifierKeys) => void> = {
    main: this.#moveOrSelectPieceByClick,
    context: () => void 0,
    auxiliary: this.#removePieceFromSquare,
  };

  //#endregion

  //#region Public Methods

  /**
   * Sets the board position using FEN notation
   * @param fen - Forsyth-Edwards Notation string
   */
  setFen(fen: string): void {
    this.setAttribute('fen', fen);
  }

  /**
   * Gets the current FEN string
   * @returns Current FEN string or empty string if not set
   */
  getFen(): string {
    return this.#currentFen;
  }

  /**
   * Sets the board to the standard starting position
   */
  setStartingPosition(): void {
    this.setFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  }

  /**
   * Clears all pieces from the board
   */
  clearBoard(): void {
    this.setFen('8/8/8/8/8/8/8/8 w - - 0 1');
  }


  /**
   * Gets the currently selected square coordinate
   * @returns Current square coordinate or null if none selected
   */
  getCurrentSquare(): string | null {
    return this.#currentSquare;
  }

  getSelectedPieceSquare(): string | null {
    return this.#selectedPieceSquare;
  }

  /**
   * Selects the piece on a square and makes that square current
   * @param coordinate - Square coordinate (e.g., "e4", "a1")
   * @returns True when a piece was selected, false when the square is empty
   * @throws Error if coordinate is invalid
   */
  selectPiece(coordinate: string): boolean {
    return this.#setSelectedPiece(coordinate);
  }

  /**
   * Sets the currently selected square
   * @param coordinate - Square coordinate (e.g., "e4", "a1")
   */
  selectSquare(coordinate: string): void {
    this.#setCurrentSquare(coordinate);
  }

  /**
   * Adds a piece to the specified square (replaces existing piece if present)
   * @param square - Square coordinate (e.g., "e4", "a1")
   * @param pieceType - Type of piece (`${number}` | "k" | "q" | "r" | "b" | "n" | "p" | "e" | "t" | "a" | "x" | "s" | "c" | `'${string}` | `''${string}`)
   * @param color - Color of piece ('w', 'b', 'n')
   * @param rotation - Optional rotation angle (0, 45, 90, 135, 180, 225, 270, 315)
   * @throws Error if coordinate is invalid
   */
  addPiece(square: string, pieceType: ChessPieceType, color: ChessPieceColor, rotation?: ChessPieceRotation): void {
    if (!this.#isValidCoordinate(square)) {
      throw new Error(`Invalid square coordinate: ${square}. Must be a valid square from a1 to h8.`);
    }
    this.#addPieceToSquare(square, { 
      type: pieceType, 
      color, 
      rotation
    });
    this.#serializeBoardState(true);
  }

  /**
   * Removes a piece from the specified square
   * @param square - Square coordinate (e.g., "e4", "a1")
   * @throws Error if coordinate is invalid
   */
  removePiece(square: string): void {
    if (!this.#isValidCoordinate(square)) {
      throw new Error(`Invalid square coordinate: ${square}. Must be a valid square from a1 to h8.`);
    }
    this.#removePieceFromSquare(square);
    this.#serializeBoardState(true);
  }

  /**
   * Gets information about the piece at the specified square
   * @param square - Square coordinate (e.g., "e4", "a1")
   * @returns Piece information or null if square is empty
   * @throws Error if coordinate is invalid
   */
  getPieceAt(square: string): Omit<PieceInfo, 'square'> | null {
    if (!this.#isValidCoordinate(square)) {
      throw new Error(`Invalid square coordinate: ${square}. Must be a valid square from a1 to h8.`);
    }
    return this.#getPieceAtSquare(square);
  }

  /**
   * Checks if the specified square has a piece
   * @param square - Square coordinate (e.g., "e4", "a1")
   * @returns True if square has a piece, false if empty
   * @throws Error if coordinate is invalid
   */
  hasPiece(square: string): boolean {
    if (!this.#isValidCoordinate(square)) {
      throw new Error(`Invalid square coordinate: ${square}. Must be a valid square from a1 to h8.`);
    }
    return this.#getPieceAtSquare(square) !== null;
  }

  /**
   * Gets all pieces currently on the board
   * @returns Array of pieces with their positions and properties
   */
  getAllPieces(): PieceInfoWithSquare[] {
    const pieces: PieceInfoWithSquare[] = [];
    const squares = this.#shadow.querySelectorAll('.square');
    
    squares.forEach(square => {
      const coordinate = square.getAttribute('data-coordinate');
      if (coordinate) {
        const pieceInfo = this.#getPieceAtSquare(coordinate);
        if (pieceInfo) {
          pieces.push({
            ...pieceInfo,
            square: coordinate,
          });
        }
      }
    });
    
    return pieces;
  }

  /**
   * Sets multiple pieces on the board at once (clears board first)
   * @param pieces - Array of pieces with their positions and properties
   * @throws Error if any coordinate is invalid
   */
  setPieces(pieces: Array<PieceInfoWithSquare>): void {
    // Validate all coordinates first
    for (const piece of pieces) {
      if (!this.#isValidCoordinate(piece.square)) {
        throw new Error(`Invalid square coordinate: ${piece.square}. Must be a valid square from a1 to h8.`);
      }
    }
    
    // Clear board
    this.#clearPieces();
    
    // Add all pieces (skip per-piece serialization; serialize once at the end)
    for (const piece of pieces) {
      this.#addPieceToSquare(piece.square, piece);
    }
    this.#serializeBoardState(true);
  }

  /**
   * Rotates a piece on the specified square by a relative amount
   * @param square - Square coordinate (e.g., "e4", "a1")
   * @param degrees - Rotation delta in degrees (will be rounded to nearest 45°)
   * @throws Error if coordinate is invalid or square is empty
   */
  rotatePiece(square: string, degrees: number): void {
    if (!this.#isValidCoordinate(square)) {
      throw new Error(`Invalid square coordinate: ${square}. Must be a valid square from a1 to h8.`);
    }
    if (!this.hasPiece(square)) {
      throw new Error(`No piece at square ${square} to rotate.`);
    }
    this.#rotatePieceOnSquare(square, degrees);
  }

  /**
   * Sets the absolute rotation of a piece on the specified square
   * @param square - Square coordinate (e.g., "e4", "a1")
   * @param rotation - Rotation angle (0, 45, 90, 135, 180, 225, 270, 315)
   * @throws Error if coordinate is invalid or square is empty
   */
  setPieceRotation(square: string, rotation: ChessPieceRotation): void {
    if (!this.#isValidCoordinate(square)) {
      throw new Error(`Invalid square coordinate: ${square}. Must be a valid square from a1 to h8.`);
    }
    if (!this.hasPiece(square)) {
      throw new Error(`No piece at square ${square} to rotate.`);
    }
    this.#setPieceRotationOnSquare(square, parseInt(rotation));
  }

  /**
   * Gets the rotation of the piece on the specified square
   * @param square - Square coordinate (e.g., "e4", "a1")
   * @returns Rotation angle or null if square is empty
   * @throws Error if coordinate is invalid
   */
  getPieceRotation(square: string): ChessPieceRotation | undefined {
    if (!this.#isValidCoordinate(square)) {
      throw new Error(`Invalid square coordinate: ${square}. Must be a valid square from a1 to h8.`);
    }
    const pieceInfo = this.#getPieceAtSquare(square);
    return pieceInfo ? pieceInfo.rotation : undefined;
  }

  /**
   * Sets the board orientation (which side is at bottom)
   * @param orientation - 'white' for white at bottom, 'black' for black at bottom
   */
  setOrientation(orientation: 'white' | 'black'): void {
    this.#setBoardOrientation(orientation);
  }

  /**
   * Gets the current board orientation
   * @returns 'white' if white is at bottom, 'black' if black is at bottom
   */
  getOrientation(): 'white' | 'black' {
    return this.hasAttribute('black-to-move') ? 'black' : 'white';
  }

  /**
   * Toggles the board orientation between white and black
   */
  toggleOrientation(): void {
    const currentOrientation = this.getOrientation();
    this.setOrientation(currentOrientation === 'white' ? 'black' : 'white');
  }
  //#endregion
}

// Register the custom element
if (!customElements.get('chess-board')) {
  customElements.define('chess-board', ChessBoard);
}
