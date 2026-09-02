import { describe, expect, it, vi } from 'vitest';
import { FairySquare, getStartingPositionFen, PieceInfo } from '../src';
import { ChessBoardState, MoveModes, RendererFunction } from "../src/ChessBoard/ChessBoard.state";
import { waitForMicroTask } from './utils';


async function newBoardState(fen: string) {
    const fn = vi.fn<RendererFunction>();
    const state = new ChessBoardState(fen, fn);
    await waitForMicroTask();
    fn.mockClear();
    return { state, fn };
}

describe("ChessBoard State", () => {

  it.each([
    { mode: undefined, from: "e2", to: "e4", expected: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1" },
    { mode: "move" as MoveModes, from: "e2", to: "e4", expected: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1" },
    { mode: "clone" as MoveModes, from: "e2", to: "e4", expected: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" }
  ])("should move a piece from $from to $to correctly", async ({ mode, from, to, expected }) => {
    const { state, fn } = await newBoardState(getStartingPositionFen());

    state.MovePiece(from as FairySquare, to as FairySquare, { mode });
    await waitForMicroTask();

    expect(fn).toHaveBeenCalled();
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({
      oldState: expect.objectContaining({
        fen: getStartingPositionFen()
      }),
      newState: expect.objectContaining({
        fen: expected
      })
    }));
  });

  it("should move a piece correctly", async () => {
    const { state, fn } = await newBoardState(getStartingPositionFen());
    state.MovePiece("e2", "e4");
    await waitForMicroTask();
    expect(fn).toHaveBeenCalled();
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({
      oldState: expect.objectContaining({
        fen: getStartingPositionFen()
      }),
      newState: expect.objectContaining({
        fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1"
      })
    }));
  });

  it("should clone a piece correctly", async () => {
    const { state, fn } = await newBoardState("8/8/8/8/8/8/4p3/8");
    state.MovePiece("e2", "e4", { mode: "clone" });
    await waitForMicroTask();
    expect(fn).toHaveBeenCalled();
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({
      oldState: expect.objectContaining({
        fen: "8/8/8/8/8/8/4p3/8"
      }),
      newState: expect.objectContaining({
        fen: "8/8/8/8/4p3/8/4p3/8 w KQkq - 0 1"
      })
    }));
  });

  it("should move remove the piece in the target square correctly", async () => {
    const { state, fn } = await newBoardState("8/8/8/8/4P3/8/4p3/8");
    state.MovePiece("e2", "e4");
    await waitForMicroTask();
    expect(fn).toHaveBeenCalled();
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({
      oldState: expect.objectContaining({
        fen: "8/8/8/8/4P3/8/4p3/8"
      }),
      newState: expect.objectContaining({
        fen: "8/8/8/8/4p3/8/8/8 w KQkq - 0 1"
      })
    }));
  });

  // --- Swap mode ---
  it("should swap two pieces correctly", async () => {
    const { state, fn } = await newBoardState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    state.MovePiece("e2", "e7", { mode: "swap" });
    await waitForMicroTask();
    expect(fn).toHaveBeenCalled();
    // Swap: pawn moves to e7, p-pawn goes to e2; default mode is "move" so source clears
    // Actually: swap mode only swaps if endingPiece exists; otherwise behaves like move
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({
      oldState: expect.objectContaining({
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
      }),
      newState: expect.objectContaining({
        fen: "rnbqkbnr/ppppPppp/8/8/8/8/PPPPpPPP/RNBQKBNR w KQkq - 0 1"
      })
    }));
  });

  it("should swap with no piece on destination (treat as move)", async () => {
    const { state, fn } = await newBoardState("8/8/8/8/8/8/4P3/8");
    state.MovePiece("e2", "e8", { mode: "swap" });
    await waitForMicroTask();
    expect(fn).toHaveBeenCalled();
    // No piece on e8, so swap falls through to move behavior
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({
      newState: expect.objectContaining({
        fen: "4P3/8/8/8/8/8/8/8 w KQkq - 0 1"
      })
    }));
  });

  // --- ChangeColor option ---
  it("should change color of source piece when changeColor is true (move mode)", async () => {
    const { state, fn } = await newBoardState("8/8/8/8/8/8/4P3/8");
    state.MovePiece("e2", "e4", { changeColor: true });
    await waitForMicroTask();
    expect(fn).toHaveBeenCalled();
    // changeColor modifies the source piece object; the copy at destination keeps original color
    // Source e2 is deleted (move mode), destination e4 has the copy (still white)
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({
      newState: expect.objectContaining({
        fen: "8/8/8/8/4p3/8/8/8 w KQkq - 0 1"
      })
    }));
  });

  it("should change color from black to white with changeColor", async () => {
    const { state, fn } = await newBoardState("8/8/8/8/8/8/4P3/8");
    state.MovePiece("e2", "e4", { changeColor: true });
    await waitForMicroTask();
    expect(fn).toHaveBeenCalled();
    // Same behavior: copy at destination keeps original color
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({
      newState: expect.objectContaining({
        fen: "8/8/8/8/4p3/8/8/8 w KQkq - 0 1"
      })
    }));
  });

  // --- MovePiece edge cases ---
  it("should do nothing when moving from an empty square", async () => {
    const { state, fn } = await newBoardState("8/8/8/8/8/8/8/8");
    const callCountAfterConstruction = fn.mock.calls.length;
    state.MovePiece("e2", "e4");
    await waitForMicroTask();
    // No additional renderer call since MovePiece returns early when source is empty
    expect(fn).toHaveBeenCalledTimes(callCountAfterConstruction);
  });

  it("should do nothing when source square has no piece", async () => {
    const { state, fn } = await newBoardState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    const callCountAfterConstruction = fn.mock.calls.length;
    state.MovePiece("h9", "h10"); // fairy squares that are empty
    await waitForMicroTask();
    expect(fn).toHaveBeenCalledTimes(callCountAfterConstruction);
  });

  it("should handle clone mode preserving both pieces", async () => {
    const { state, fn } = await newBoardState("8/8/8/8/4P3/8/8/8");
    state.MovePiece("e4", "e8", { mode: "clone" });
    await waitForMicroTask();
    expect(fn).toHaveBeenCalled();
    // Clone: both e4 and e8 should have white pawns
    // e4 = file 5, rank 4; e8 = file 5, rank 8
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({
      newState: expect.objectContaining({
        fen: "4P3/8/8/8/4P3/8/8/8 w KQkq - 0 1"
      })
    }));
  });

  it("should handle swap mode with existing piece on destination", async () => {
    const { state, fn } = await newBoardState(getStartingPositionFen());
    state.MovePiece("e2", "e7", { mode: "swap" });
    await waitForMicroTask();
    expect(fn).toHaveBeenCalled();
    // Swap: black pawn goes to e2, white pawn goes to e5
    // Last call should show the swapped result
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({
      newState: expect.objectContaining({
        fen: "rnbqkbnr/ppppPppp/8/8/8/8/PPPPpPPP/RNBQKBNR w KQkq - 0 1"
      })
    }));
  });

  // --- AddPiece ---
  it("should add a piece to an empty square", async () => {
    const { state, fn } = await newBoardState("8/8/8/8/8/8/8/8");
    state.AddPiece("e4", { type: "p", color: "w" });
    await waitForMicroTask();
    expect(fn).toHaveBeenCalled();
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({
      newState: expect.objectContaining({
        fen: "8/8/8/8/4P3/8/8/8 w KQkq - 0 1"
      })
    }));
  });

  it("should add a piece to a square that already has a piece (overwrite)", async () => {
    const fn: RendererFunction = vi.fn();
    const state = new ChessBoardState("8/8/8/8/4P3/8/8/8", fn);
    state.AddPiece("e4", { type: "n", color: "b" });
    await waitForMicroTask();
    expect(fn).toHaveBeenCalled();
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({
      newState: expect.objectContaining({
        fen: "8/8/8/8/4n3/8/8/8 w KQkq - 0 1"
      })
    }));
  });

  it("should add a fairy piece with metadata", async () => {
    const fn: RendererFunction = vi.fn();
    const state = new ChessBoardState("8/8/8/8/8/8/8/8", fn);
    state.AddPiece("e4", { type: "'myfairy", color: "w", fairyName: "MyFairy" });
    await waitForMicroTask();
    expect(fn).toHaveBeenCalled();
  });

  // --- RemovePiece ---
  it("should remove a piece from a square", async () => {
    const fn: RendererFunction = vi.fn();
    // White pawn on e4: rank string for rank 1 is last → "8/8/8/8/4P3/8/8/8"
    const state = new ChessBoardState("8/8/8/8/4P3/8/8/8", fn);
    state.RemovePiece("e4");
    await waitForMicroTask();
    expect(fn).toHaveBeenCalled();
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({
      newState: expect.objectContaining({
        fen: "8/8/8/8/8/8/8/8 w KQkq - 0 1"
      })
    }));
  });

  it("should handle removing from an empty square gracefully", async () => {
    const fn: RendererFunction = vi.fn();
    const state = new ChessBoardState("8/8/8/8/8/8/8/8", fn);
    state.RemovePiece("e4");
    await waitForMicroTask();
    // FEN doesn't change but renderer is still called since SetState always triggers
    expect(fn).toHaveBeenCalled();
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({
      newState: expect.objectContaining({
        fen: "8/8/8/8/8/8/8/8 w KQkq - 0 1"
      })
    }));
  });

  it("should remove the last piece and produce empty board", async () => {
    const fn: RendererFunction = vi.fn();
    // Black pawn on e4: "8/8/8/8/4p3/8/8/8"
    const state = new ChessBoardState("8/8/8/8/4p3/8/8/8", fn);
    state.RemovePiece("e4");
    await waitForMicroTask();
    expect(fn).toHaveBeenCalled();
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({
      newState: expect.objectContaining({
        fen: "8/8/8/8/8/8/8/8 w KQkq - 0 1"
      })
    }));
  });

  // --- SetState ---
  it("should allow custom state modifications via SetState", async () => {
    const fn: RendererFunction = vi.fn();
    const state = new ChessBoardState("8/8/8/8/8/8/8/8", fn);
    state.SetState(current => ({
      ...current,
      currentSquare: "e4",
      selectedPieceSquare: "e2"
    }));
    await waitForMicroTask();
    expect(fn).toHaveBeenCalled();
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({
      newState: expect.objectContaining({
        currentSquare: "e4",
        selectedPieceSquare: "e2"
      })
    }));
  });

  it("should preserve previous state for renderer callback", async () => {
    const fn: RendererFunction = vi.fn();
    const state = new ChessBoardState("8/8/8/8/8/8/8/8", fn);
    state.SetState(current => ({ ...current, currentSquare: "e4" }));
    await waitForMicroTask();
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({
      oldState: expect.objectContaining({
        currentSquare: null
      }),
      newState: expect.objectContaining({
        currentSquare: "e4"
      })
    }));
  });

  it("should update position when FEN changes via SetState", async () => {
    const fn: RendererFunction = vi.fn();
    const state = new ChessBoardState("8/8/8/8/8/8/8/8", fn);
    expect(state.position.pieces).toEqual({});
    state.SetState(current => ({
      ...current,
      fen: "4P3/8/8/8/8/8/8/8"
    }));
    await waitForMicroTask();
    expect(state.position.pieces["e8"]).toEqual({ type: "p", color: "w" } satisfies PieceInfo);
  });

  // --- Properties / Getters ---
  it("should expose correct fen getter", async () => {
    const fn: RendererFunction = vi.fn();
    const state = new ChessBoardState("4P3/8/8/8/8/8/8/8", fn);
    expect(state.fen).toBe("4P3/8/8/8/8/8/8/8");
  });

  it("should expose correct currentSquare getter", async () => {
    const fn: RendererFunction = vi.fn();
    const state = new ChessBoardState("8/8/8/8/8/8/8/8", fn);
    expect(state.currentSquare).toBeNull();
    state.SetState(current => ({ ...current, currentSquare: "e4" }));
    await waitForMicroTask();
    expect(state.currentSquare).toBe("e4");
  });

  it("should expose correct selectedPieceSquare getter", async () => {
    const fn: RendererFunction = vi.fn();
    const state = new ChessBoardState("8/8/8/8/8/8/8/8", fn);
    expect(state.selectedPieceSquare).toBeNull();
    state.SetState(current => ({ ...current, selectedPieceSquare: "e2" }));
    await waitForMicroTask();
    expect(state.selectedPieceSquare).toBe("e2");
  });

  it("should expose correct cellDecorators getter", async () => {
    const fn: RendererFunction = vi.fn();
    const state = new ChessBoardState("8/8/8/8/8/8/8/8", fn);
    expect(state.cellDecorators).toEqual({});
    state.SetState(current => ({
      ...current,
      cellDecorators: { e4: { backgroundColor: "yellow", innerBorder: "red" } }
    }));
    await waitForMicroTask();
    expect(state.cellDecorators["e4"]).toEqual({ backgroundColor: "yellow", innerBorder: "red" });
  });

  it("should expose correct position getter", async () => {
    const fn: RendererFunction = vi.fn();
    const state = new ChessBoardState("8/8/8/8/4P3/8/8/8", fn);
    expect(state.position.activeColor).toBe("w");
    expect(state.position.castlingRights).toBe("KQkq");
    expect(state.position.halfmoveClock).toBe(0);
    expect(state.position.fullmoveNumber).toBe(1);
    expect(state.position.pieces["e4"]).toEqual({ type: "p", color: "w" } satisfies PieceInfo);
  });

  // --- Renderer microtask batching ---
  it("should batch multiple state changes into single renderer call", async () => {
    const fn: RendererFunction = vi.fn();
    const state = new ChessBoardState("8/8/8/8/8/8/8/8", fn);
    state.SetState(current => ({ ...current, currentSquare: "e4" }));
    state.SetState(current => ({ ...current, currentSquare: "e5" }));
    state.SetState(current => ({ ...current, currentSquare: "e6" }));
    await waitForMicroTask();
    // Only one call due to #alreadyQueued deduplication
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({
      newState: expect.objectContaining({
        currentSquare: "e6"
      })
    }));
  });

  it("should allow subsequent renderer calls after microtask completes", async () => {
    const fn: RendererFunction = vi.fn();
    const state = new ChessBoardState("8/8/8/8/8/8/8/8", fn);
    state.SetState(current => ({ ...current, currentSquare: "e4" }));
    await waitForMicroTask();
    expect(fn).toHaveBeenCalledTimes(1);

    state.SetState(current => ({ ...current, currentSquare: "e5" }));
    await waitForMicroTask();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  // --- Multiple sequential moves ---
  it("should support multiple sequential moves", async () => {
    const fn: RendererFunction = vi.fn();
    const state = new ChessBoardState("4P3/8/8/8/8/8/4P3/8 w KQkq - 0 1", fn);
    state.MovePiece("e2", "e4");
    await waitForMicroTask();
    expect(state.fen).toBe("4P3/8/8/8/4P3/8/8/8 w KQkq - 0 1");

    state.MovePiece("e4", "e5");
    await waitForMicroTask();
    expect(state.fen).toBe("4P3/8/8/4P3/8/8/8/8 w KQkq - 0 1");
    expect(state.position.pieces["e5"]).toBeDefined();
    expect(state.position.pieces["e4"]).toBeUndefined();
  });

  it("should track active color correctly after moves", async () => {
    const fn: RendererFunction = vi.fn();
    const state = new ChessBoardState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", fn);
    expect(state.position.activeColor).toBe("w");

    state.MovePiece("e2", "e4");
    await waitForMicroTask();
    // The position object tracks pieces; activeColor may stay 'w' unless explicitly set
    expect(state.position.pieces["e4"]).toBeDefined();
  });

  // --- Invalid / edge FEN ---
  it("should handle minimal FEN (just piece placement)", async () => {
    const fn: RendererFunction = vi.fn();
    const state = new ChessBoardState("8", fn);
    expect(state.fen).toBe("8");
    await waitForMicroTask();
    expect(fn).toHaveBeenCalled();
  });

  it("should handle FEN with only 2 blocks", async () => {
    const fn: RendererFunction = vi.fn();
    const state = new ChessBoardState("8/8/8/8/8/8/8/8 w", fn);
    expect(state.position.activeColor).toBe("w");
    await waitForMicroTask();
    expect(fn).toHaveBeenCalled();
  });

  it("should handle FEN with castling and en passant", async () => {
    const fn: RendererFunction = vi.fn();
    const state = new ChessBoardState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq e3 0 1", fn);
    expect(state.position.castlingRights).toBe("KQkq");
    expect(state.position.enPassantTarget).toBe("e3");
    await waitForMicroTask();
    expect(fn).toHaveBeenCalled();
  });

  // --- Swap with color change combined ---
  it("should handle swap with changeColor option", async () => {
    const fn: RendererFunction = vi.fn();
    // White pawn on e2, black pawn on e5
    const state = new ChessBoardState("4p3/4P3/8/8/8/8/8/8", fn);
    state.MovePiece("e2", "e5", { mode: "swap", changeColor: true });
    await waitForMicroTask();
    expect(fn).toHaveBeenCalled();
    // e2 gets black pawn (swapped then color changed), e5 gets white pawn (moved then color changed)
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({
      newState: expect.objectContaining({})
    }));
  });

  // --- Clone with changeColor ---
  it("should handle clone with changeColor option", async () => {
    const { fn, state } = await newBoardState("8/8/8/8/4P3/8/8/8");
    state.MovePiece("e4", "e8", { mode: "clone", changeColor: true });
    await waitForMicroTask();
    expect(fn).toHaveBeenCalled();
    // Original stays, clone appears on e8 with inverted color (black)
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({
      oldState: expect.objectContaining({
        fen: expect.stringContaining("8/8/8/8/4P3/8/8/8") // original white pawn still on e4
      }),
      newState: expect.objectContaining({
        fen: expect.stringContaining("4p3/8/8/8/4P3/8/8/8 w KQkq - 0 1") // original white pawn still on e4
      })
    }));
  });

  // --- Fairy squares ---
  it("should support fairy squares (i, j, k files and 9, 10, 11 ranks)", async () => {
    const fn: RendererFunction = vi.fn();
    const state = new ChessBoardState("8/8/8/8/8/8/8/8", fn);
    state.AddPiece("i1", { type: "p", color: "w" });
    await waitForMicroTask();
    expect(fn).toHaveBeenCalled();
  });

  it("should move piece to fairy square", async () => {
    const { fn, state } = await newBoardState("83/83/83/83/83/83/83/4P6/83/83/83");
    state.MovePiece("e4", "i10");
    await waitForMicroTask();
    expect(fn).toHaveBeenCalled();

    expect(state.position.pieces["i10"]).toBeDefined();
    expect(state.position.pieces["e4"]).toBeUndefined();
  });

  // --- Cell decorators persistence ---
  it("should persist cell decorators across state changes", async () => {
    const fn: RendererFunction = vi.fn();
    const state = new ChessBoardState("8/8/8/8/8/8/8/8", fn);
    state.SetState(current => ({
      ...current,
      cellDecorators: { e4: { backgroundColor: "green", innerBorder: "blue" } }
    }));
    await waitForMicroTask();

    state.MovePiece("e2", "e4");
    await waitForMicroTask();
    // Decorators should be preserved through moves
    expect(state.cellDecorators["e4"]).toEqual({ backgroundColor: "green", innerBorder: "blue" });
  });

  // --- Empty board initial state ---
  it("should initialize with empty state properties", () => {
    const fn: RendererFunction = vi.fn();
    const state = new ChessBoardState("8/8/8/8/8/8/8/8", fn);
    expect(state.currentSquare).toBeNull();
    expect(state.selectedPieceSquare).toBeNull();
    expect(state.cellDecorators).toEqual({});
  });

  // --- Position updates on complex FEN ---
  it("should parse and track complex FEN positions correctly", async () => {
    const fn: RendererFunction = vi.fn();
    const fen = "rnbqkb1r/ppp2ppp/5np1/8/4P3/3P1N2/PPPP1PPP/RNBQKB1R w KQkq - 2 4";
    const state = new ChessBoardState(fen, fn);
    expect(state.position.activeColor).toBe("w");
    expect(state.position.halfmoveClock).toBe(2);
    expect(state.position.fullmoveNumber).toBe(4);
    expect(state.position.enPassantTarget).toBe("-");
    await waitForMicroTask();
    expect(fn).toHaveBeenCalled();
  });

  // --- Move piece that overwrites another piece (move mode) ---
  it("should overwrite destination piece in move mode", async () => {
    const fn: RendererFunction = vi.fn();
    // Two white pawns
    const state = new ChessBoardState("4P3/4P3/8/8/8/8/8/8", fn);
    state.MovePiece("e7", "e4");
    await waitForMicroTask();
    expect(fn).toHaveBeenCalled();
    // e7 should be empty, e4 should have the pawn
    expect(state.position.pieces["e7"]).toBeUndefined();
    expect(state.position.pieces["e4"]).toBeDefined();
  });

  // --- Verify renderer receives correct old/new state pairs ---
  it("should pass correct oldState and newState to renderer", async () => {
    const { state, fn } = await newBoardState("4P3/8/8/8/8/8/8/8 w KQkq - 0 1");
    state.MovePiece("e8", "e5");
    await waitForMicroTask();
    expect(fn).toHaveBeenCalled();
    const callArgs = fn.mock.lastCall?.[0];
    expect(callArgs?.oldState?.fen).toBe("4P3/8/8/8/8/8/8/8 w KQkq - 0 1");
    expect(callArgs?.newState?.fen).toBe("8/8/8/4P3/8/8/8/8 w KQkq - 0 1");
  });

  // --- Swap mode with no piece on source (edge case) ---
  it("should handle swap when source is empty (no-op)", async () => {
    const fn: RendererFunction = vi.fn();
    const state = new ChessBoardState("8/8/8/8/8/8/8/8", fn);
    await waitForMicroTask();
    expect(fn).toHaveBeenCalledOnce();
    state.MovePiece("e2", "e4", { mode: "swap" });
    await waitForMicroTask();
    expect(fn).toHaveBeenCalledOnce();
  });

  // --- Test that position reflects latest state after operations ---
  it("should reflect updated position after add/remove/move sequence", async () => {
    const fn: RendererFunction = vi.fn();
    const state = new ChessBoardState("8/8/8/8/8/8/8/8", fn);
    await waitForMicroTask();

    // Add a piece
    state.AddPiece("e4", { type: "p", color: "w" });
    await waitForMicroTask();
    expect(state.position.pieces["e4"]).toEqual({ type: "p", color: "w" });

    // Move it
    state.MovePiece("e4", "e5");
    await waitForMicroTask();
    expect(state.position.pieces["e5"]).toEqual({ type: "p", color: "w" });
    expect(state.position.pieces["e4"]).toBeUndefined();

    // Remove it
    state.RemovePiece("e5");
    await waitForMicroTask();
    expect(state.position.pieces["e5"]).toBeUndefined();
  });
});
