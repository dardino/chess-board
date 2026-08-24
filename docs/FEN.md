# Forsyth-Edwards Notation (FEN) Support

This document provides comprehensive documentation for the FEN utilities included in the chess-board library.

## Overview

Forsyth-Edwards Notation (FEN) is a standard notation for describing a particular board position of a chess game. The chess-board library provides complete support for parsing, generating, and working with FEN strings.

## FEN Format

A FEN string consists of six fields separated by spaces:

```text
rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
```

### Fields

1. **Piece placement** - Describes the position of pieces on the board
2. **Active color** - `w` for white to move, `b` for black to move
3. **Castling rights** - Rights for castling (e.g., `KQkq` or `-`)
4. **En passant target** - Target square for en passant capture (e.g., `e3` or `-`)
5. **Halfmove clock** - Number of halfmoves since last capture or pawn advance
6. **Fullmove number** - Current move number (increments after black's move)

## Piece Notation

| Piece | White | Black | Description |
|-------|-------|-------|-------------|
| King | `K` | `k` | ♔ ♚ |
| Queen | `Q` | `q` | ♕ ♛ |
| Rook | `R` | `r` | ♖ ♜ |
| Bishop | `B` | `b` | ♗ ♝ |
| Knight | `N` | `n` | ♘ ♞ |
| Pawn | `P` | `p` | ♙ ♟ |

## API Reference

### Core Functions

#### `parseFen(fen: string): FenPosition | null`

Parses a complete FEN string into a structured position object.

```typescript
import { parseFen } from '@dardino/chess-board';

const position = parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

if (position) {
  console.log(position.activeColor); // 'w'
  console.log(position.pieces.length); // 32
}
```

**Returns**: `FenPosition` object or `null` if the FEN string is invalid.

#### `positionToFen(position: FenPosition): string`

Converts a structured position object back to a FEN string.

```typescript
import { positionToFen, type FenPosition } from '@dardino/chess-board';

const position: FenPosition = {
  pieces: [
    { type: 'k', color: 'w', square: 'e1' },
    { type: 'k', color: 'b', square: 'e8' }
  ],
  activeColor: 'w',
  castlingRights: 'KQkq',
  enPassantTarget: '-',
  halfmoveClock: 0,
  fullmoveNumber: 1
};

const fen = positionToFen(position);
console.log(fen); // '4k3/8/8/8/8/8/8/4K3 w KQkq - 0 1'
```

#### `parsePiecePlacement(piecePlacement: string): ChessPiece[] | null`

Parses only the piece placement part of FEN (first field).

```typescript
import { parsePiecePlacement } from '@dardino/chess-board';

const pieces = parsePiecePlacement('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');

if (pieces) {
  console.log(pieces.length); // 32
  const whiteKing = pieces.find(p => p.square === 'e1');
  console.log(whiteKing); // { type: 'k', color: 'w', square: 'e1' }
}
```

**Returns**: Array of `ChessPiece` objects or `null` if invalid.

#### `piecesToFenString(pieces: ChessPiece[]): string`

Converts an array of pieces back to FEN piece placement string.

```typescript
import { piecesToFenString, type ChessPiece } from '@dardino/chess-board';

const pieces: ChessPiece[] = [
  { type: 'k', color: 'w', square: 'e1' },
  { type: 'q', color: 'b', square: 'd8' }
];

const fenString = piecesToFenString(pieces);
console.log(fenString); // '3k4/8/8/8/8/8/8/4K3'
```

### Utility Functions

#### `parsePieceChar(char: string): { type: ChessPieceType; color: ChessPieceColor } | null`

Parses a single piece character (e.g., 'K', 'q') into type and color.

```typescript
import { parsePieceChar } from '@dardino/chess-board';

console.log(parsePieceChar('K')); // { type: 'k', color: 'w' }
console.log(parsePieceChar('q')); // { type: 'q', color: 'b' }
console.log(parsePieceChar('X')); // null (invalid)
```

#### `pieceToChar(piece: ChessPiece): string`

Converts a piece object back to FEN character.

```typescript
import { pieceToChar, type ChessPiece } from '@dardino/chess-board';

const whiteKing: ChessPiece = { type: 'k', color: 'w', square: 'e1' };
console.log(pieceToChar(whiteKing)); // 'K'

const blackQueen: ChessPiece = { type: 'q', color: 'b', square: 'd8' };
console.log(pieceToChar(blackQueen)); // 'q'
```

#### `getStartingPositionFen(): string`

Returns the FEN string for the standard chess starting position.

```typescript
import { getStartingPositionFen } from '@dardino/chess-board';

const startingFen = getStartingPositionFen();
console.log(startingFen); // 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
```

#### `getEmptyBoardFen(): string`

Returns the FEN string for an empty chess board.

```typescript
import { getEmptyBoardFen } from '@dardino/chess-board';

const emptyFen = getEmptyBoardFen();
console.log(emptyFen); // '8/8/8/8/8/8/8/8 w - - 0 1'
```

## Type Definitions

### `ChessPiece`

```typescript
interface ChessPiece {
  type: ChessPieceType;     // 'k' | 'q' | 'r' | 'b' | 'n' | 'p'
  color: ChessPieceColor;   // 'w' | 'b'
  square: string;           // Algebraic notation, e.g., 'e4', 'a1'
}
```

### `FenPosition`

```typescript
interface FenPosition {
  pieces: ChessPiece[];     // All pieces on the board
  activeColor: 'w' | 'b';   // Side to move
  castlingRights: string;   // Castling rights, e.g., 'KQkq' or '-'
  enPassantTarget: string;  // En passant target square or '-'
  halfmoveClock: number;    // Halfmoves since last capture/pawn move
  fullmoveNumber: number;   // Current move number
}
```

### `ChessPieceType`

```typescript
type ChessPieceType = 'k' | 'q' | 'r' | 'b' | 'n' | 'p';
```

### `ChessPieceColor`

```typescript
type ChessPieceColor = 'w' | 'b';
```

## Examples

### Loading Chess Positions

```typescript
import { parseFen } from '@dardino/chess-board';

// Scholar's mate position
const scholarsMate = parseFen('r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 1');

// King's Indian Defense
const kingsIndian = parseFen('rnbqkb1r/pppppp1p/5np1/8/2PPP3/8/PP3PPP/RNBQKBNR b KQkq - 0 1');

// Endgame position
const endgame = parseFen('8/8/8/8/8/8/8/R3K2k w Q - 0 1');
```

### Creating Custom Positions

```typescript
import { piecesToFenString, positionToFen, type ChessPiece } from '@dardino/chess-board';

// Create a custom piece arrangement
const pieces: ChessPiece[] = [
  { type: 'k', color: 'w', square: 'g1' },
  { type: 'k', color: 'b', square: 'g8' },
  { type: 'q', color: 'w', square: 'd1' },
  { type: 'r', color: 'b', square: 'a8' },
  { type: 'n', color: 'w', square: 'f3' }
];

const piecePlacement = piecesToFenString(pieces);
console.log(piecePlacement); // 'r3k3/8/8/8/8/5N2/8/3QK1K1'

// Create complete FEN
const position = {
  pieces,
  activeColor: 'w' as const,
  castlingRights: '-',
  enPassantTarget: '-',
  halfmoveClock: 0,
  fullmoveNumber: 1
};

const fullFen = positionToFen(position);
console.log(fullFen); // 'r3k3/8/8/8/8/5N2/8/3QK1K1 w - - 0 1'
```

### Board Integration

```typescript
import { parseFen } from '@dardino/chess-board';

// HTML: <chess-board id="board"></chess-board>
const board = document.getElementById('board') as any; // ChessBoard element

// Load a famous position
const caroKann = parseFen('rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1');
if (caroKann) {
  // Convert back to FEN for the board
  const fenString = [
    piecesToFenString(caroKann.pieces),
    caroKann.activeColor,
    caroKann.castlingRights,
    caroKann.enPassantTarget,
    caroKann.halfmoveClock.toString(),
    caroKann.fullmoveNumber.toString()
  ].join(' ');

  board.setFen(fenString);
}
```

### Position Analysis

```typescript
import { parseFen } from '@dardino/chess-board';

function analyzePosition(fen: string) {
  const position = parseFen(fen);
  if (!position) {
    console.error('Invalid FEN');
    return;
  }

  const whitePieces = position.pieces.filter(p => p.color === 'w');
  const blackPieces = position.pieces.filter(p => p.color === 'b');

  console.log(`White pieces: ${whitePieces.length}`);
  console.log(`Black pieces: ${blackPieces.length}`);
  console.log(`Side to move: ${position.activeColor}`);
  console.log(`Castling rights: ${position.castlingRights}`);
  console.log(`En passant: ${position.enPassantTarget}`);
}

// Analyze starting position
analyzePosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
```

## Error Handling

All parsing functions return `null` for invalid input:

```typescript
import { parseFen, parsePiecePlacement } from '@dardino/chess-board';

// Invalid FEN strings
console.log(parseFen('invalid')); // null
console.log(parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 extra')); // null
console.log(parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR x KQkq - 0 1')); // null (invalid color)

// Invalid piece placement
console.log(parsePiecePlacement('rnbqkbnr/pppppppp/9/8/8/8/PPPPPPPP/RNBQKBNR')); // null (invalid rank)
```

## Testing

The FEN utilities include comprehensive tests covering:

- Valid FEN parsing and generation
- Invalid input handling
- Round-trip conversion (FEN → Position → FEN)
- Edge cases and special positions
- Type safety and error conditions

Run tests with:

```bash
npm run test
```

## Performance

The FEN parsing and generation functions are optimized for performance:

- **Piece placement parsing**: O(1) - fixed 8x8 board
- **FEN generation**: O(n) where n is number of pieces
- **Validation**: O(1) - fixed format checking
- **Memory usage**: Minimal - no external dependencies

## Browser Support

The FEN utilities work in all modern browsers that support:

- ES2018+ features
- TypeScript compiled to ES2018
- Standard string and array methods

## Related Links

- [FEN on Wikipedia](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation)
- [Chess Programming Wiki - FEN](https://www.chessprogramming.org/Forsyth-Edwards_Notation)
- [Online FEN Viewer](https://lichess.org/analysis)
