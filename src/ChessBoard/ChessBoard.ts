/**
 * ChessBoard Web Component
 * A custom element for displaying a chess board
 */
import { ChessPiece } from '../ChessPiece/ChessPiece';
import { CellDecorator, ChessPieceColor, ChessPieceRotation, ChessPieceType, FairyPieceMetadata, FairySquare, PieceInfo, PieceInfoWithSquare, PiecesOnBoard, Square } from '../Common/Types';
import { isValidCoordinate } from '../Utilities/board';
import { FenPosition, positionToFen } from '../Utilities/fen';
import { checkModifiers } from '../Utilities/keyboard';
import { applyTemplateAndCss, bindToAttribute } from '../Utilities/webcomponent';
import style from './ChessBoard.css?raw';
import template from './ChessBoard.html?raw';
import { drawAllCells, drawBoardLabels, setCurrentSelectedPiece, setCurrentSquare, syncPiecesToCell } from './ChessBoard.renderer';
import { ChessBoardState, RendererFunction } from './ChessBoard.state';

type ModifierKeys = Pick<MouseEvent, 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'>;

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

  interface Document {
    createElement(tagName: 'chess-board'): ChessBoard;
  }

  interface HTMLElementEventMap {
    /**
     * Fired when a main button click occurs on a chessboard cell.
     */
    cellMainClick: CustomEvent<CellClickEventDetail>;
    /**
     * Fired when a main button click occurs on a chessboard cell.
     * @deprecated Use cellMainClick instead. This alias is kept for backward compatibility.
     */
    cellClick: CustomEvent<CellClickEventDetail>;
    /**
     * Fired when a context button click occurs on a chessboard cell.
     */
    cellContextClick: CustomEvent<CellClickEventDetail>;
    /**
     * Fired when an auxiliary button click occurs on a chessboard cell.
     */
    cellAuxiliaryClick: CustomEvent<CellClickEventDetail>;
    /**
     * Fired when the FEN string of the chessboard changes.
     */
    fenChange: CustomEvent<FenChangeEventDetail>;
  }
}

export class ChessBoard extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['fen', 'hide-labels', 'disabled', 'black-to-move'];
  }

  #shadow: ShadowRoot;
  #state: ChessBoardState;
  get #board(): HTMLElement | null {
    const board = this.#shadow.querySelector<HTMLElement>('.board');
    return board;
  }
  get #squares(): NodeListOf<HTMLElement> | null {
    const squares = this.#shadow.querySelectorAll<HTMLElement>('.square');
    return squares;
  }
  get #topLabelsContainer(): HTMLElement | null {
    const div = this.#shadow.querySelector<HTMLElement>('.top-labels');
    return div;
  }
  get #bottomLabelsContainer(): HTMLElement | null {
    const div = this.#shadow.querySelector<HTMLElement>('.bottom-labels');
    return div;
  }
  get #leftLabelsContainer(): HTMLElement | null {
    const div = this.#shadow.querySelector<HTMLElement>('.left-labels');
    return div;
  }
  get #rightLabelsContainer(): HTMLElement | null {
    const div = this.#shadow.querySelector<HTMLElement>('.right-labels');
    return div;
  }
  get #boardContainer(): HTMLElement | null {
    const div = this.#shadow.querySelector<HTMLElement>('.board-container');
    return div;
  }

  //#region Public Attributes
  @bindToAttribute('disabled', "boolean")
  /**
   * Whether the chessboard is disabled. When disabled, user interactions are blocked.
   */
  public disabled: boolean = false;
  @bindToAttribute('disable-piece-selection', "boolean")
  /**
   * Whether piece selection is disabled on the chessboard.
   */
  public disablePieceSelection: boolean = false;
  @bindToAttribute('disable-piece-addition', "boolean")
  /**
   * Whether piece addition is disabled on the chessboard.
   */
  public disablePieceAddition: boolean = false;  
  @bindToAttribute('ignore-fen-active-color', "boolean")
  /**
   * Whether to ignore the active color specified in the FEN string.
   */
  public ignoreFenActiveColor: boolean = false;
  @bindToAttribute('auto-select-piece-on-click', "boolean")
  /**
   * Whether to automatically select a piece when it is clicked.
   */
  public autoSelectPieceOnClick: boolean = false;
  @bindToAttribute('black-to-move', "boolean")
  /**
   * Whether it is black's turn to move on the chessboard.
   */
  public blackToMove: boolean = false;
  @bindToAttribute('fen', "string")
  /**
   * The FEN string representing the current state of the chessboard.
   */
  public fen: string = '';
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
    const newSquare = this.#moveUp(this.#state.currentSquare!, this.blackToMove);
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
    const newSquare = this.#moveDown(this.#state.currentSquare!, this.blackToMove);
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
    const newSquare = this.#moveLeft(this.#state.currentSquare!);
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
    const newSquare = this.#moveRight(this.#state.currentSquare!);
    if (newSquare) {
      event.preventDefault();
      this.#setCurrentSquare(newSquare);
    }
  };
  #handleDelete = (event: KeyboardEvent): void => {
    if (!checkModifiers(event)) return;
    this.#removePieceFromCurrentSquare();
    this.#clearSelectedPiece();
    this.#serializeBoardState(true);
    event.preventDefault();
  };
  #handleEscape = (event: KeyboardEvent): void => {
    if (!checkModifiers(event)) return;
    // If a piece is selected, clear the selection
    if (this.#state.selectedPieceSquare !== null) {
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

    if (!this.#state.currentSquare) {
      return;
    }

    const currentSquareHasPiece = this.hasPiece(this.#state.currentSquare);
    const currentSelection = this.#state.selectedPieceSquare;

    // If the current square has a piece and no piece is selected, select the piece
    if (currentSquareHasPiece && !currentSelection) {
      this.#setSelectedPiece(this.#state.currentSquare);
      return;
    }
    // If the current square has a piece and a piece is already selected, toggle selection
    else if (currentSquareHasPiece && currentSelection === this.#state.currentSquare) {
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
    this.#movePiece(currentSelection, this.#state.currentSquare, mode);
  };
  
  #movePiece = (fromSquare: FairySquare, toSquare: FairySquare, cloneMode: "clone" | "changecolor" | "none"): void => {
    const piece = this.#getPieceAtSquare(fromSquare);
    if (piece) {
      if (cloneMode === "none") {
        // if not in clone mode, remove the piece from the original square
        this.removePiece(fromSquare);
      }
      this.removePiece(toSquare);
      if (cloneMode === "changecolor") {
        piece.color = piece.color === "w" ? "b" : "w";
      }
      this.#state.AddPiece(toSquare, piece);
    }
    this.#clearSelectedPiece();
    this.#serializeBoardState(true);
  };

  #handleAddPiece = (pieceType: ChessPieceType, color: ChessPieceColor): (event: KeyboardEvent) => void => {
    return (event: KeyboardEvent) => {
      if (!checkModifiers(event)) return;
      if (this.disablePieceAddition) return;
      this.#state.AddPiece(this.#state.currentSquare!, {
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
    this.setOrientation('white');
    event.preventDefault();
  };
  #handleFlipToBlack = (event: KeyboardEvent): void => {
    this.setOrientation('black');
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
    if (!this.#state.currentSquare || this.disabled) return;

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
    applyTemplateAndCss(this.#shadow, template, style);
    this.#state = new ChessBoardState(this.getAttribute('fen') || '', this.#render);
  }

  connectedCallback(): void {
    this.#firstRender();
    this.#setupEventListeners();
  }

  disconnectedCallback(): void {
    this.#removeEventListeners();
  }
  
  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (oldValue !== newValue) {
      if (name === 'fen') {
        if (this.#state.fen === newValue) return; // No change, no need to update
        this.#state.SetState((old) => ({ ...old, fen: newValue || '' }));
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
    this.#firstRenderDone = true;    // Update labels visibility based on attribute
    this.#updateLabelsVisibility();

    // Restore current square selection if it exists
    if (this.#state.currentSquare) {
      this.#setCurrentSquare(this.#state.currentSquare);
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
    const square = cell.getAttribute('data-coordinate') as FairySquare | null;
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

  #moveOrSelectPieceByClick = (square: FairySquare, mods?: ModifierKeys): void => {
    mods = mods ?? {
      shiftKey: false,
      ctrlKey: false,
      altKey: false,
      metaKey: false,
    };
    // Set this square as current
    // If the square is already current, call SelectedPiece logic to toggle selection or move piece
    const alreadyCurrent = this.#state.currentSquare === square;
    if (alreadyCurrent) {
      this.selectPiece(square);
    } else {
      this.#setCurrentSquare(square);
      // check if a piece is selected and if so, move it to the clicked square
      if (this.#state.selectedPieceSquare !== square && this.#state.selectedPieceSquare) {
        const piece = this.getPieceAt(this.#state.selectedPieceSquare);
        if (!piece) return;
        if (mods.shiftKey) {
          this.#movePiece(this.#state.selectedPieceSquare, square, "clone");
        } else if (mods.ctrlKey) {
          this.#movePiece(this.#state.selectedPieceSquare, square, "changecolor");
        } else {
          this.#movePiece(this.#state.selectedPieceSquare, square, "none");
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
    const cell = square.getAttribute('data-coordinate') as FairySquare | null;
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
    if (!this.#state.currentSquare) {
      this.#setCurrentSquare('a1');
    }
  }

  #handleBlur = (): void => {
    this.#clearSelectedPiece();
  }

  // Syncs fairy metadata edited directly on a chess-piece element (bypassing the state API) back into the state.
  #handleFairyMetadataChange = (ev: CustomEvent<FairyPieceMetadata>): void => {
    const target = ev.target as HTMLElement | null;
    const square = target?.closest('.square')?.getAttribute('data-coordinate') as FairySquare | null;
    const piece = square ? this.#state.position.pieces[square] : null;
    if (!square || !piece) return;

    const oldFen = this.#state.fen;
    this.#state.AddPiece(square, { ...piece, fairyName: ev.detail.fairyName, fairyCondition: ev.detail.fairyCondition });
    if (this.#state.fen !== oldFen) this.#triggerFenChangeEvent();
  }

  #updateDisabledState(): void {
    const isDisabled = this.hasAttribute('disabled');
    if (this.#board) {
      this.#board.style.pointerEvents = isDisabled ? 'none' : 'auto';
    }
  }

  #setCurrentSquare(coordinate: FairySquare): void {
    this.#state.SetState(state => ({ ...state, currentSquare: coordinate }));
  }


  #clearSelectedPiece(): void {
    this.#state.SetState(state => ({ ...state, selectedPieceSquare: null }));
  }

  #moveUp(current: FairySquare, isRotated: boolean): FairySquare | null {
    const file = current[0];
    const rank = parseInt(current[1]);
    
    if (isRotated) {
      // When rotated, "up" means decreasing rank (towards rank 1)
      return rank > 1 ? `${file}${rank - 1}` as FairySquare : null;
    } else {
      // Normal orientation: "up" means increasing rank (towards rank 8)
      return rank < 8 ? `${file}${rank + 1}` as FairySquare : null;
    }
  }

  #moveDown(current: FairySquare, isRotated: boolean): FairySquare | null {
    const file = current[0];
    const rank = parseInt(current[1]);
    
    if (isRotated) {
      // When rotated, "down" means increasing rank (towards rank 8)
      return rank < 8 ? `${file}${rank + 1}` as FairySquare : null;
    } else {
      // Normal orientation: "down" means decreasing rank (towards rank 1)
      return rank > 1 ? `${file}${rank - 1}` as FairySquare : null;
    }
  }

  #moveLeft(current: FairySquare): FairySquare | null {
    const file = current[0];
    const rank = current[1];
    const fileIndex = file.charCodeAt(0) - 'a'.charCodeAt(0);
    
    return fileIndex > 0 ? `${String.fromCharCode('a'.charCodeAt(0) + fileIndex - 1)}${rank}` as FairySquare : null;
  }

  #moveRight(current: FairySquare): FairySquare | null {
    const file = current[0];
    const rank = current[1];
    const fileIndex = file.charCodeAt(0) - 'a'.charCodeAt(0);
    
    return fileIndex < 7 ? `${String.fromCharCode('a'.charCodeAt(0) + fileIndex + 1)}${rank}` as FairySquare : null;
  }

  #removePieceFromCurrentSquare(): void {
    if (!this.#state.currentSquare) return;
    delete this.#state.position.pieces[this.#state.currentSquare];
    this.#state.SetState(state => ({ ...state,
      fen: positionToFen(this.#state.position)
    }));
  }

  /**
   * Helper method to rotate piece on a specific square by delta degrees
   * @param coordinate - Square coordinate (e.g., "e4", "a1")
   * @param delta - Rotation delta in degrees
   */
  #rotatePieceOnSquare(coordinate: FairySquare, delta: number): void {
    const piece = this.#state.position.pieces[coordinate];
    if (!piece) return;

    const currentRotation = parseInt(piece.rotation ?? '0') || 0;
    let newRotation = (currentRotation + delta) % 360;
    
    // Normalize to positive angle
    if (newRotation < 0) newRotation += 360;
    
    // Round to nearest 45 degrees
    newRotation = Math.round(newRotation / 45) * 45;
    if (newRotation === 360) newRotation = 0;

    this.#state.AddPiece(coordinate, { ...piece, rotation: newRotation.toString() as ChessPieceRotation });
  }

  #rotatePieceOnCurrentSquare(delta: number): void {
    if (!this.#state.currentSquare) return;
    this.#rotatePieceOnSquare(this.#state.currentSquare, delta);
  }

  /**
   * Helper method to set absolute rotation on a specific square
   * @param coordinate - Square coordinate (e.g., "e4", "a1")
   * @param rotation - Rotation angle (0, 45, 90, 135, 180, 225, 270, 315)
   */
  #setPieceRotationOnSquare(coordinate: FairySquare, rotation: number): void {
    const piece = this.#state.position.pieces[coordinate];
    if (!piece) return;

    this.#state.AddPiece(coordinate, { ...piece, rotation: rotation.toString() as ChessPieceRotation });
  }

  #setPieceRotationOnCurrentSquare(rotation: number): void {
    if (!this.#state.currentSquare) return;
    this.#setPieceRotationOnSquare(this.#state.currentSquare, rotation);
  }

  /**
   * Helper method to get piece information at a specific square
   * @param coordinate - Square coordinate (e.g., "e4", "a1")
   * @returns Piece information or null if square is empty
   */
  #getPieceAtSquare(coordinate: FairySquare): PieceInfo | null {
    const piece = this.#state.position.pieces[coordinate];
    if (!piece) return null;

    const pieceatsquare: PieceInfo = {
      type: piece.type,
      color: piece.color
    };

    if (piece.rotation && parseInt(piece.rotation) > 0) pieceatsquare.rotation = piece.rotation;
    if (piece.fairyName) pieceatsquare.fairyName = piece.fairyName;
    if (piece.fairyCondition) pieceatsquare.fairyCondition = piece.fairyCondition;
    return pieceatsquare;
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
      const coordinate = square.getAttribute('data-coordinate') as Square;
      const decorator = coordinate ? this.#state.cellDecorators[coordinate] : undefined;
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
   * Applies a decorator layer to selected cells.
   * Decorators render as an internal overlay immediately above the cell background and below all other content.
   * @param decoratorsMap - Map of square coordinate to decorator definition
   */
  setCellDecorators(decoratorsMap: Partial<Record<Square, CellDecorator>>): void {
    for (const square of Object.keys(decoratorsMap)) {
      if (!isValidCoordinate(square, this.#state.position.boardSize)) {
        throw new Error(`Invalid square coordinate: ${square}. 
          Must be a valid square from a1 to 
          ${String.fromCharCode('a'.charCodeAt(0) + this.#state.position.boardSize.width - 1)}1
          to ${String.fromCharCode('a'.charCodeAt(0) + this.#state.position.boardSize.width - 1)}${this.#state.position.boardSize.height}.`);
      }
    }

    this.#state.SetState(state => ({ ...state, cellDecorators: { ...decoratorsMap } }));
    this.#updateCellDecorators();
  }

  #serializeBoardState(triggerChange: boolean): void {
    const oldFen = this.#state.fen;

    const position: FenPosition = {
      pieces: this.getAllPieces().reduce((acc, piece) => {
        acc[piece.square] = {
          type: piece.type,
          color: piece.color,
          fairyCondition: piece.fairyCondition,
          fairyName: piece.fairyName,
          rotation: piece.rotation,
        };
        return acc;
      }, {} as PiecesOnBoard),
      activeColor: this.#state.position.activeColor,
      castlingRights: this.#state.position.castlingRights,
      enPassantTarget: this.#state.position.enPassantTarget,
      halfmoveClock: this.#state.position.halfmoveClock,
      fullmoveNumber: this.#state.position.fullmoveNumber,
      boardSize: this.#state.position.boardSize,
    };

    const newFen = positionToFen(position);
    if (oldFen !== newFen) {
      this.#state.SetState(currentState => ({ ...currentState, fen: newFen }));
      if (triggerChange) this.#triggerFenChangeEvent();
    }
  }

  /**
   * Synchronizes the board state with the new State of the chessboard.
   * @param param0 
   */
  #render: RendererFunction = ({oldState, newState}): void => {
    const currentFen = oldState?.fen;
    this.fen = newState.fen;

    const width = newState.position.boardSize.width;
    const height = newState.position.boardSize.height;
    this.#boardContainer?.style.setProperty('--board-width', width.toString());
    this.#boardContainer?.style.setProperty('--board-height', height.toString());

    // Only re-derive the turn indicator when the FEN actually changed, so a manual
    // orientation flip isn't clobbered by a render triggered by unrelated state changes.
    if (!this.ignoreFenActiveColor && currentFen !== newState.fen) {
      const activeColor = newState.position.activeColor;
      if (activeColor === 'b') {
        this.blackToMove = true;
      } else {
        this.blackToMove = false;
      }
    }

    // draw the top and bottom labels
    drawBoardLabels(newState.position.boardSize.width, this.#topLabelsContainer, this.#bottomLabelsContainer, 'column');
    // draw the left and right labels
    drawBoardLabels(newState.position.boardSize.height, this.#leftLabelsContainer, this.#rightLabelsContainer, 'row');
    // draw all cells
    drawAllCells(newState.position.boardSize.width, newState.position.boardSize.height, this.#board);
    // add pieces to cells
    syncPiecesToCell(newState.position, this.#board);
    // update the current square highlight
    setCurrentSquare(newState.currentSquare, this.#board);
    // update the selected piece highlight
    setCurrentSelectedPiece(this.#state.selectedPieceSquare, this.#board);

    if (currentFen !== newState.fen) {
      this.#triggerFenChangeEvent();
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
        detail: { fen: this.#state.fen } satisfies FenChangeEventDetail,
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
    if (!isValidCoordinate(coordinate, this.#state.position.boardSize)) {
      throw new Error(`Invalid square coordinate: ${coordinate}`);
    }

    this.#setCurrentSquare(coordinate);
    let returnValue: boolean = false;

    if (!this.hasPiece(coordinate)) {
      this.#clearSelectedPiece();
    } else  if (this.#state.selectedPieceSquare === coordinate) {
      this.#clearSelectedPiece();
    } else {
      this.#state.SetState(state => ({ ...state, selectedPieceSquare: coordinate }));
      returnValue = true;
    }

    return returnValue;
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
    return this.#state.fen;
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
    return this.#state.currentSquare;
  }

  getSelectedPieceSquare(): string | null {
    return this.#state.selectedPieceSquare;
  }

  /**
   * Selects the piece on a square and makes that square current
   * @param coordinate - Square coordinate (e.g., "e4", "a1")
   * @returns True when a piece was selected, false when the square is empty
   * @throws Error if coordinate is invalid
   */
  selectPiece(coordinate: FairySquare): boolean {
    return this.#setSelectedPiece(coordinate);
  }

  /**
   * Sets the currently selected square
   * @param coordinate - Square coordinate (FairySquare) (e.g., "e4", "a1")
   */
  selectSquare(coordinate: FairySquare): void {
    this.#state.SetState(state => ({ ...state, currentSquare: coordinate }));
  }

  /**
   * Adds a piece to the specified square (replaces existing piece if present)
   * @param square - Square coordinate (FairySquare) (e.g., "e4", "a1")
   * @param pieceType - Type of piece (`${number}` | "k" | "q" | "r" | "b" | "n" | "p" | "e" | "t" | "a" | "x" | "s" | "c" | `'${string}` | `''${string}`)
   * @param color - Color of piece ('w', 'b', 'n')
   * @param rotation - Optional rotation angle (0, 45, 90, 135, 180, 225, 270, 315)
   * @throws Error if coordinate is invalid
   */
  addPiece(square: FairySquare, pieceType: ChessPieceType, color: ChessPieceColor, rotation?: ChessPieceRotation, fairyName?: string, fairyCondition?: string): void {
    if (!isValidCoordinate(square, this.#state.position.boardSize)) {
      throw new Error(`Invalid square coordinate: ${square}. Must be a valid square from a1 to h8.`);
    }

    this.#state.AddPiece(square, { 
      type: pieceType,
      color,
      rotation,
      fairyName,
      fairyCondition
    });

  }

  /**
   * Removes a piece from the specified square
   * @param square - Square coordinate (FairySquare) (e.g., "e4", "a1")
   * @throws Error if coordinate is invalid
   */
  removePiece = (square: FairySquare): void => {
    if (!isValidCoordinate(square, this.#state.position.boardSize)) {
      throw new Error(`Invalid square coordinate: ${square}. Must be a valid square from a1 to h8.`);
    }
    delete this.#state.position.pieces[square];
    this.#state.SetState(state => ({ ...state,
      fen: positionToFen(this.#state.position)
    }));
  }

  /**
   * Gets information about the piece at the specified square
   * @param square - Square coordinate (FairySquare) (e.g., "e4", "a1")
   * @returns Piece information or null if square is empty
   * @throws Error if coordinate is invalid
   */
  getPieceAt(square: FairySquare): Omit<PieceInfo, 'square'> | null {
    if (!isValidCoordinate(square, this.#state.position.boardSize)) {
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
  hasPiece(square: FairySquare): boolean {
    if (!isValidCoordinate(square, this.#state.position.boardSize)) {
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

    for (const coordinate of Object.keys(this.#state.position.pieces) as FairySquare[]) {
      const pieceInfo = this.#getPieceAtSquare(coordinate);
      if (pieceInfo) {
        pieces.push({
          ...pieceInfo,
          square: coordinate as Square,
        });
      }
    }

    return pieces;
  }

  getPiecesOnBoard(): PiecesOnBoard {
    return this.#state.position.pieces;
  }

  /**
   * Sets multiple pieces on the board at once (clears board first)
   * @param pieces - Object mapping square coordinates to piece information
   * @throws Error if any coordinate is invalid
   */
  setPieces(pieces: PiecesOnBoard): void {
    // Validate all coordinates first
    Object.keys(pieces).forEach(square => {
      if (!isValidCoordinate(square, this.#state.position.boardSize)) {
        throw new Error(`Invalid square coordinate: ${square}. Must be a valid square from a1 to h8.`);
      }
    });
    this.#state.SetState(old => {
      return { 
        ...old,
        fen: positionToFen({
          ...old.position,
          pieces
        })
      };
    });
  }

  /**
   * Rotates a piece on the specified square by a relative amount
   * @param square - Square coordinate (e.g., "e4", "a1")
   * @param degrees - Rotation delta in degrees (will be rounded to nearest 45°)
   * @throws Error if coordinate is invalid or square is empty
   */
  rotatePiece(square: FairySquare, degrees: number): void {
    if (!isValidCoordinate(square, this.#state.position.boardSize)) {
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
  setPieceRotation(square: FairySquare, rotation: ChessPieceRotation): void {
    if (!isValidCoordinate(square, this.#state.position.boardSize)) {
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
  getPieceRotation(square: FairySquare): ChessPieceRotation | undefined {
    if (!isValidCoordinate(square, this.#state.position.boardSize)) {
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
    console.log("🚀 ~ ChessBoard ~ setOrientation ~ orientation:", orientation)
    this.blackToMove = orientation === 'black';
  }

  /**
   * Gets the current board orientation
   * @returns 'white' if white is at bottom, 'black' if black is at bottom
   */
  getOrientation(): 'white' | 'black' {
    const isBlackToMove = this.blackToMove;
    return isBlackToMove ? 'black' : 'white';
  }

  /**
   * Toggles the board orientation between white and black
   */
  toggleOrientation(): void {
    const currentOrientation = this.getOrientation();
    this.setOrientation(currentOrientation === 'white' ? 'black' : 'white');
  }
  //#endregion

  #mouseActions: Record<"main" | "context" | "auxiliary", (square: FairySquare, mods?: ModifierKeys) => void> = {
    main: this.#moveOrSelectPieceByClick,
    context: () => void 0,
    auxiliary: this.removePiece,
  };

}

// Register the custom element
if (!customElements.get('chess-board')) {
  customElements.define('chess-board', ChessBoard);
}
