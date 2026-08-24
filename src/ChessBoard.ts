/**
 * ChessBoard Web Component
 * A custom element for displaying a chess board
 */
import style from './ChessBoard.css?raw';
import template from './ChessBoard.html?raw';
import { ChessPiece, type ChessPieceColor, type ChessPieceRotation, type ChessPieceType } from './ChessPiece';
import { FairyPieceMetadata, FenPosition, parseFen, positionToFen, type FENChessPiece as FenChessPiece } from './fen';

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
}
export interface FenChangeEventDetail {
  fen: string;
}

// Augment DOM typings so addEventListener/removeEventListener recognize the custom 'cellClick' event
declare global {
  interface HTMLElementEventMap {
    cellClick: CustomEvent<CellClickEventDetail>;
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
    return ['fen', 'hide-labels'];
  }

  #shadow: ShadowRoot;
  #currentFen: string = '';
  #squares: NodeListOf<HTMLElement> | null = null;
  #clickHandlers: WeakMap<Element, EventListener> = new WeakMap();
  #currentSquare: string | null = null;
  #selectedPieceSquare: string | null = null;
  #cellDecorators: Partial<Record<Square, CellDecorator>> = {};

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
    if (!this.#checkModifiers(event)) return;
    if (!this.#currentSquare) {
      return;
    }

    const currentSquareHasPiece = this.hasPiece(this.#currentSquare);
    const currentSelection = !!this.#selectedPieceSquare;

    // If the current square has a piece and no piece is selected, select the piece
    if (currentSquareHasPiece && !currentSelection) {
      this.#setSelectedPiece(this.#currentSquare);
    }
    // If the current square has a piece and a piece is already selected, toggle selection
    else if (currentSquareHasPiece && this.#selectedPieceSquare === this.#currentSquare) {
      this.#clearSelectedPiece();
    }
    // If the current square does not have a piece and no piece is selected, do nothing
    if (!currentSelection) {
      event.preventDefault();
      return;
    }
    const piece = this.#getPieceAtSquare(this.#selectedPieceSquare!);
    this.#removePieceFromSquare(this.#currentSquare!);
    this.#removePieceFromSquare(this.#selectedPieceSquare!);
    if (piece) {
      this.#addPieceToSquare(this.#currentSquare!, piece);
    }
    this.#clearSelectedPiece();
    this.#setCurrentSquare(this.#currentSquare);
    event.preventDefault();
  };
  #handleAddPiece = (pieceType: ChessPieceType, color: ChessPieceColor): (event: KeyboardEvent) => void => {
    return (event: KeyboardEvent) => {
      if (!this.#checkModifiers(event)) return;
      this.#addPieceToSquare(this.#currentSquare!, {
        type: pieceType,
        color
      });
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
    'A': this.#handleAddPiece('a', 'w')
  };

  #handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.#currentSquare) return;

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
      ) this.#clearSelectedPiece();
    
    this.#serializeBoardState();
  }
  //#endregion

  //#region Lifecycle Callbacks
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
    }
  }

  //#endregion

  //#region Private Methods

  #firstRender(): void {
    // Create container from imported HTML template
    const templateContainer = document.createElement('div');
    templateContainer.innerHTML = template;

    // Add styles
    const styleElement = document.createElement('style');
    styleElement.textContent = style;
    this.#shadow.appendChild(styleElement);

    const tmpl = templateContainer.querySelector("template");
    if (!tmpl) {
      throw new Error("Template not found in the provided HTML.");
    }
    this.#shadow.appendChild(tmpl.content.cloneNode(true));

    // Update labels visibility based on attribute
    this.#updateLabelsVisibility();

    // Restore current square selection if it exists
    if (this.#currentSquare) {
      this.#setCurrentSquare(this.#currentSquare);
    }
  }

  #setupEventListeners(): void {
    this.#squares = this.#shadow.querySelectorAll('.square');
    this.#squares.forEach(square => {
      if (!(square instanceof HTMLElement)) return;
      const boundHandler = this.#handleSquareClick.bind(this, square);
      this.#clickHandlers.set(square, boundHandler);
      square.addEventListener('click', boundHandler);
    });

    // Add keyboard navigation
    const board = this.#shadow.querySelector('.board') as HTMLElement;
    if (board) {
      board.addEventListener('keydown', this.#handleKeyDown);
      board.addEventListener('focus', this.#handleFocus);
      board.addEventListener('blur', this.#handleBlur);
      board.addEventListener('fairy-metadata-changed', this.#handleFairyMetadataChange);
    }
  }

  #removeEventListeners(): void {
    if (this.#squares) {
      this.#squares.forEach(square => {
        const boundHandler = this.#clickHandlers.get(square);
        if (boundHandler) {
          square.removeEventListener('click', boundHandler);
          this.#clickHandlers.delete(square);
        }
      });
      this.#squares = null;
    }

    // Remove keyboard and focus event listeners
    const board = this.#shadow.querySelector('.board') as HTMLElement;
    if (board) {
      board.removeEventListener('keydown', this.#handleKeyDown);
      board.removeEventListener('focus', this.#handleFocus);
      board.removeEventListener('blur', this.#handleBlur);
      board.removeEventListener('fairy-metadata-changed', this.#handleFairyMetadataChange);
    }
  }

  #handleSquareClick(square: HTMLElement): void {
    const cell = square.getAttribute('data-coordinate');
    
    if (!cell) {
      return;
    }

    // Set this square as current
    this.#setCurrentSquare(cell);

    // Check if there's a piece on this square
    const pieceElement = square.querySelector('chess-piece') as ChessPiece;
    let piece: PieceInfo | undefined;

    if (pieceElement) {
      const pieceType = pieceElement.getPiece();
      const pieceColor = pieceElement.getColor();
      const rotation = pieceElement.getRotation();
      const fairyName = pieceElement.getFairyName();
      const fairyCondition = pieceElement.getFairyCondition();
      
      if (pieceType && pieceColor) {

        piece = {
          type: pieceType,
          color: pieceColor,
        };

        // Add optional properties if present
        if (parseInt(rotation) > 0) piece.rotation = rotation;
        if (fairyName) piece.fairyName = fairyName;
        if (fairyCondition) piece.fairyCondition = fairyCondition;
        
      }
    }

    this.dispatchEvent(new CustomEvent('cellClick', {
      detail: {
        square: cell,
        piece,
      } satisfies CellClickEventDetail,
      bubbles: true,
      composed: true
    }));
  }

  #handleFocus = (): void => {
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
    this.#serializeBoardState();
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
  #removePieceFromSquare(coordinate: string): void {
    const square = this.#shadow.querySelector(`[data-coordinate="${coordinate}"]`) as HTMLElement;
    if (!square) return;

    const piece = square.querySelector('chess-piece');
    if (piece) {
      square.removeChild(piece);
    }
  }

  #removePieceFromCurrentSquare(): void {
    if (!this.#currentSquare) return;
    this.#removePieceFromSquare(this.#currentSquare);
    this.#serializeBoardState();
  }

  /**
   * Helper method to add or replace piece on a specific square
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
    this.#serializeBoardState();
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
      color: piece.getColor(),
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
    const fenString = this.#currentFen;
    if (!fenString) {
      return;
    }

    const position = parseFen(fenString);
    if (position) {
      this.#updateBoardOrientation(position.activeColor);
    }
    
    this.#serializeBoardState();

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
      // Apply fairy metadata if available (from FFEN 7th block)
      if (position.fairyMetadata && position.fairyMetadata[piece.square]) {
        const metadata = position.fairyMetadata[piece.square];
        piece.fairyName = metadata.fairyName;
        piece.fairyCondition = metadata.fairyCondition;
      }
      
      this.#placePiece(piece);
    }

    // Sync computed FEN/FFEN fields after loading from attribute
    this.#serializeBoardState();
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

  #serializeBoardState(): void {
    const fairyMetadata: NonNullable<FenPosition['fairyMetadata']> = {};
    this.#squares?.forEach(square => {
      const coordinate = square.getAttribute('data-coordinate');
      const pieceElement = square.querySelector('chess-piece');
      if (!coordinate || !pieceElement) return;
      const fairyName = pieceElement.getAttribute('fairy-name');
      const fairyCondition = pieceElement.getAttribute('fairy-condition');
      if (fairyName || fairyCondition) {
        fairyMetadata[coordinate] = {
          fairyName: fairyName || undefined,
          fairyCondition: fairyCondition || undefined
        };
      }
    });

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
      fullmoveNumber: 1,
      fairyMetadata
    };

    this.#currentFen = positionToFen(position);
    this.setAttribute('fen', this.#currentFen);

    this.#triggerFenChangeEvent();
  }

  #iseventqueued = false;
  #triggerFenChangeEvent(): void {
    if (this.#iseventqueued) return;
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
    if (!this.#isValidCoordinate(coordinate)) {
      throw new Error(`Invalid square coordinate: ${coordinate}`);
    }

    this.#setCurrentSquare(coordinate);

    if (!this.hasPiece(coordinate)) {
      this.#clearSelectedPiece();
      return false;
    }

    this.#selectedPieceSquare = coordinate;
    this.#updateSelectedPieceState();
    return true;
  }

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
   * @param pieceType - Type of piece ('k', 'q', 'r', 'b', 'n', 'p', 'e', 't', 'a')
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
    this.#serializeBoardState();
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
    this.#serializeBoardState();
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
