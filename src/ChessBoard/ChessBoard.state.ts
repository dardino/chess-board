import { CellDecorator, FairySquare, PieceInfo, Square } from "../Common/Types";
import { FenPosition, parseFen, positionToFen, StartingPosition } from "../Utilities/fen";

export type ChessBoardStateInterface = {
  fen: string;
  currentSquare: FairySquare | null;
  selectedPieceSquare: FairySquare | null;
  cellDecorators: Partial<Record<Square, CellDecorator>>;
  boardOrientation: "w" | "b";
  position: FenPosition;
}
export type RendererFunction = (args: {
  oldState: ChessBoardStateInterface | null, 
  newState: ChessBoardStateInterface
}) => void;
export type MoveModes = "clone" | "swap" | "move";
export type MoveOptions = {
  mode?: MoveModes,
  changeColor?: boolean
};

export class ChessBoardState {

  #state: ChessBoardStateInterface = { fen: '', currentSquare: null, selectedPieceSquare: null, cellDecorators: {}, boardOrientation: "w", position: { ...StartingPosition } };
  #renderer: RendererFunction;
  #prevState: ChessBoardStateInterface | null = null;

  get fen(): string {
    return this.#state.fen;
  }
  get currentSquare(): FairySquare | null {
    return this.#state.currentSquare;
  }
  get selectedPieceSquare(): FairySquare | null {
    return this.#state.selectedPieceSquare;
  }
  get cellDecorators(): Partial<Record<Square, CellDecorator>> {
    return this.#state.cellDecorators;
  }
  get position(): FenPosition {
    return this.#state.position;
  }

  pendingUIUpdate = false;
  constructor(initialFEN: string, renderer: RendererFunction) {
    this.#state = { fen: initialFEN, currentSquare: null, selectedPieceSquare: null, cellDecorators: {}, boardOrientation: "w", position: { ...StartingPosition } };
    this.#renderer = renderer;
    this.#state.position = parseFen(initialFEN) ?? { ...StartingPosition };
    this.pendingUIUpdate = false;
    this.setState(state => ({ ...state }));
  }

  private setState(stateModifier: (currentState: ChessBoardStateInterface) => ChessBoardStateInterface): void {
    if (!this.pendingUIUpdate) { // alla prima chiamata, salva lo stato precedente
      // Save the previous state before applying the state modifier
      this.#prevState = this.#state;
    }
    // Apply the state modifier to get the new state
    this.#state = stateModifier(JSON.parse(JSON.stringify(this.#state)));
    // if Fen has changed, update the position
    if (this.#state.fen !== this.#prevState?.fen)
      this.#state.position = parseFen(this.#state.fen) ?? { ...StartingPosition };

    // Now is time to render the new state if not alredy queued
    if (this.pendingUIUpdate) return;
    // Trigger the renderer to update the UI with the new state
    this.pendingUIUpdate = true;
    queueMicrotask(() => {
      this.pendingUIUpdate = false;
      this.#renderer({ oldState: this.#prevState, newState: this.#state });
    });
  }

  SetFen(fen: string): void {
    this.setState(currentState => ({ ...currentState, fen }));
  }

  SetCurrentSquare(square: FairySquare | null): void {
    this.setState(currentState => ({ ...currentState, currentSquare: square }));
  }

  SetSelectedPieceSquare(square: FairySquare | null): void {
    this.setState(currentState => ({ ...currentState, selectedPieceSquare: square }));
  }

  SetCellDecorators(cellDecorators: Partial<Record<Square, CellDecorator>>): void {
    this.setState(currentState => ({ ...currentState, cellDecorators: { ...cellDecorators } }));
  }

  /**
   * Updates position by moving a piece from one square to another.
   * @param from The starting square of the piece to move.
   * @param to The destination square for the piece.
   * @param options Determines how the piece should be moved:
   *                - `mode`: Can be "move" (default), "clone", or "swap".
   *                  when swap and no piece exists at the destination, it behaves like "move" source to destination.
   *                  when swap and no piece exists at the source, it behaves like "move" destination to source.
   *                - `changeColor`: Swap the color of the piece being moved.
   * @returns void
   */
  MovePiece(from: FairySquare, to: FairySquare, options: MoveOptions = { mode: "move", changeColor: false }): void {
    const mode = options.mode ?? "move";
    const startingPiece = this.#state.position.pieces[from];
    const endingPiece = this.#state.position.pieces[to];
    if (!startingPiece && !endingPiece) return;

    if (options.changeColor && startingPiece) startingPiece.color = startingPiece.color === "w" ? "b" : "w";
    if (options.changeColor && endingPiece) endingPiece.color = endingPiece.color === "w" ? "b" : "w";

    switch (mode) {
      case "swap":
        if (startingPiece) {
          this.#state.position.pieces[to] = { ...startingPiece };
          if (options.changeColor) startingPiece.color = startingPiece.color === "w" ? "b" : "w";
        } else {
          delete this.#state.position.pieces[to];
        }
        if (endingPiece) {
          this.#state.position.pieces[from] = { ...endingPiece };
          if (options.changeColor) endingPiece.color = endingPiece.color === "w" ? "b" : "w";
        } else {
          delete this.#state.position.pieces[from];
        }
        break;
      case "move":
      case "clone":
        if (!startingPiece) return;
        this.#state.position.pieces[to] = { ...startingPiece };
        if (mode === "move") delete this.#state.position.pieces[from];
        if (options.changeColor) startingPiece.color = startingPiece.color === "w" ? "b" : "w";
        break;
    }

    this.setState(currentState => ({ 
      ...currentState, 
      fen: positionToFen(this.#state.position)
    }));
  }

  /**
   * Adds a piece to the specified square on the chessboard.
   * @param square The square on the chessboard where the piece should be added.
   * @param piece The piece information to be added to the specified square.
   */
  AddPiece(square: FairySquare, piece: PieceInfo): void {
    this.setState(currentState => ({ 
      ...currentState, 
      fen: positionToFen({ 
        ...this.#state.position, 
        pieces: { 
          ...this.#state.position.pieces,
          [square]: { ...piece }
        } 
      })
    }));
  }

  /**
   * Removes the piece from the specified square on the chessboard.
   * @param square The square on the chessboard from which the piece should be removed.
   */
  RemovePiece(square: FairySquare): void {
    console.log("🚀 ~ ChessBoardState ~ RemovePiece ~ square:", square)
    delete this.#state.position.pieces[square];
    const newFen = positionToFen(this.#state.position);
    console.log("🚀 ~ ChessBoardState ~ RemovePiece ~ newFen:", newFen);
    this.setState(currentState => ({ 
      ...currentState,
      fen: newFen
    }));
  }

  /**
   * Sets the orientation of the chessboard.
   * When orientation is set to "w", the white side will be at the bottom of the board.
   * When orientation is set to "b", the black side will be at the bottom of the board.
   * @param orientation The orientation of the chessboard, either "w" for white or "b" for black.
   */
  SetBoardOrientation(orientation: "w" | "b"): void {
    this.setState(currentState => ({
      ...currentState,
      boardOrientation: orientation
    }));
  }

}
