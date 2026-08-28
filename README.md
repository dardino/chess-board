# Chess Board Web Components

A collection of web components for displaying chess boards and pieces, built with TypeScript and Vite.

## Project HomePage

This project is hosted on [GitHub Pages](https://dardino.github.io/chess-board/)

## Components

### ChessBoard (`chess-board`)

A web component for displaying a chess board with optional labels.

### ChessPiece (`chess-piece`)

A web component for displaying individual chess pieces.

## Features

- **8x8 Chess Board**: Traditional chess board layout with alternating colors
- **Individual Chess Pieces**: Separate component for each piece type and color
- **Piece Rotation**: Rotate pieces in 45° increments (0-315°) with keyboard shortcuts
- **Fairy Chess Notation**: Support for fairy-name and fairy-condition annotations for problem compositions
- **Board Labels**: Column letters (a-h) and row numbers (1-8) on all four sides
- **FEN Support**: Load and display chess positions using Forsyth-Edwards Notation
- **Board Orientation**: Manual flip between white/black perspective with keyboard shortcuts
- **Keyboard Navigation**: Full keyboard support for piece placement, rotation, and board manipulation
- **Responsive Design**: Automatically adapts to container size with container queries
- **Font Responsiveness**: Chess piece font size scales proportionally with board size using `cqw` units
- **Web Components**: Native custom elements with Shadow DOM
- **TypeScript**: Full type safety and modern development experience
- **Testing**: Comprehensive test suite with Vitest and Happy DOM (108 tests)

## Technologies

- **TypeScript**: ^5.9.3
- **Vite**: ^7.2.2
- **Vitest**: ^4.0.8 (Testing framework)
- **Happy DOM**: ^20.0.10 (DOM environment for tests)
- **ScacchiPainter Font**: Custom chess piece font with ligatures
- **vite-plugin-dts**: For TypeScript declaration generation

## TypeScript Support

This library provides full TypeScript support with comprehensive type definitions. Import the library and use the exported types for type-safe development:

```typescript
import {
  ChessBoard,
  ChessPiece,
  ChessPieceType,
  ChessPieceColor,
  CellClickPiece,
  CellClickEventDetail,
  FenPosition,
  parseFen,
  positionToFen
} from '@dardino/chess-board';

// Types for piece properties
type ChessPieceType = 'k' | 'q' | 'r' | 'b' | 'n' | 'p' | 'e' | 't' | 'a';
type ChessPieceColor = 'w' | 'b' | 'n';

// Interface for chess pieces
interface ChessPiece {
  type: ChessPieceType;
  color: ChessPieceColor;
  square: string; // e.g., 'e4', 'a1'
}

// Interface for complete FEN positions
interface FenPosition {
  pieces: ChessPiece[];
  activeColor: 'w' | 'b';
  castlingRights: string;
  enPassantTarget: string;
  halfmoveClock: number;
  fullmoveNumber: number;
}

// Example usage with full type safety
function setupBoard(): void {
  const board = new ChessBoard();

  // Type-safe FEN parsing
  const position: FenPosition | null = parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  if (position) {
    console.log('Active color:', position.activeColor); // 'w' | 'b'
    console.log('Pieces count:', position.pieces.length);
  }

  // Type-safe piece creation
  const piece = new ChessPiece();
  piece.setPiece('q', 'w'); // Only accepts valid piece types and colors

  // Type-safe board methods
  board.setFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const currentFen: string = board.getFen();

  // Type-safe event handling
  board.addEventListener('cellClick', (event: CustomEvent<CellClickEventDetail>) => {
    const { cell, piece: clickedPiece } = event.detail;
    console.log(`Clicked ${cell}`);
    if (clickedPiece) {
      console.log(`Piece: ${clickedPiece.color} ${clickedPiece.type}`);
      if (clickedPiece.rotation) {
        console.log(`Rotation: ${clickedPiece.rotation}°`);
      }
      if (clickedPiece.fairyName) {
        console.log(`Fairy name: ${clickedPiece.fairyName}`);
      }
      if (clickedPiece.fairyCondition) {
        console.log(`Fairy condition: ${clickedPiece.fairyCondition}`);
      }
    }
  });
}
```

### Type Definitions Location

TypeScript declaration files are generated in the `dist/types/` directory:

- `dist/types/index.d.ts` - Main entry point with all exports
- `dist/types/ChessBoard.d.ts` - ChessBoard component types
- `dist/types/ChessPiece.d.ts` - ChessPiece component types
- `dist/types/fen.d.ts` - FEN utility function types

### Exported Types

- `ChessPieceType`: Union type for piece types (`'k' | 'q' | 'r' | 'b' | 'n' | 'p' | 'e' | 't' | 'a'`)
- `ChessPieceColor`: Union type for piece colors (`'w' | 'b' | 'n'`)
- `ChessPieceRotation`: Union type for piece rotations (`0 | 45 | 90 | 135 | 180 | 225 | 270 | 315`)
- `ChessPiece`: Interface for individual chess pieces
- `CellClickPiece`: Interface for piece information in cell click events (includes rotation and fairy notation)
- `CellClickEventDetail`: Interface for cell click event details
- `FenPosition`: Interface for complete chess positions
- `ChessBoard`: Web component class with typed methods
- `ChessPiece`: Web component class with typed methods

### Exported Functions

- `parseFen(fen: string): FenPosition | null` - Parse FEN string to position
- `positionToFen(position: FenPosition): string` - Convert position to FEN string
- `parsePiecePlacement(piecePlacement: string): ChessPiece[] | null` - Parse FEN piece placement
- `piecesToFenString(pieces: ChessPiece[]): string` - Convert pieces to FEN string
- `parsePieceChar(char: string): { type: ChessPieceType; color: ChessPieceColor } | null` - Parse piece character
- `pieceToChar(piece: ChessPiece): string` - Convert piece to character
- `getStartingPositionFen(): string` - Get starting position FEN
- `getEmptyBoardFen(): string` - Get empty board FEN

## Installation

```bash
pnpm add @dardino/chess-board
```

## Chess Pieces

The components use ligature-based font rendering for chess pieces:

### Standard Pieces

| Piece | White | Black | Description |
| ------- | ------- | ------- | ------------- |
| King | `w_k` | `b_k` | King piece |
| Queen | `w_q` | `b_q` | Queen piece |
| Rook | `w_r` | `b_r` | Rook (castle) |
| Bishop | `w_b` | `b_b` | Bishop |
| Knight | `w_n` | `b_n` | Knight (horse) |
| Pawn | `w_p` | `b_p` | Pawn |

### Fairy Pieces

| Piece | White | Black | Neutral | Description |
| ------- | ------- | ------- | --------- | ------------- |
| Empress | `w_e` | `b_e` | `n_e` | Empress (Rook + Knight) |
| Dragon | `w_t` | `b_t` | `n_t` | Dragon (Amazon) |
| Angel/Archbishop | `w_a` | `b_a` | `n_a` | Angel/Archbishop (Bishop + Knight) |

### Color Support

- **White** (`w`): Standard white pieces
- **Black** (`b`): Standard black pieces  
- **Neutral** (`n`): Neutral pieces for problem compositions

*Note: Fairy pieces and neutral colors are commonly used in chess problem compositions and artistic chess.*

## Usage

### Basic Usage

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chess Board Demo</title>
  
  <!-- Load chess piece font (required for piece rendering) -->
  <link rel="stylesheet" href="./assets/ScacchiPainter.css" />
</head>
<body>
  <!-- Empty chess board -->
  <chess-board></chess-board>

  <!-- Individual chess pieces -->
  <chess-piece piece="k" color="w"></chess-piece>
  <chess-piece piece="q" color="b"></chess-piece>
  
  <!-- Fairy pieces -->
  <chess-piece piece="e" color="w"></chess-piece> <!-- White Empress -->
  <chess-piece piece="t" color="b"></chess-piece> <!-- Black Dragon -->
  <chess-piece piece="a" color="n"></chess-piece> <!-- Neutral Angel/Archbishop -->

  <script type="module">
    import '@dardino/chess-board';
  </script>
</body>
</html>
```

### Adding Pieces to the Board

```javascript
// Get a square by coordinate
const e4Square = document.querySelector('chess-board')
  .shadowRoot.querySelector('[data-coordinate="e4"]');

// Create and add a piece
const queen = document.createElement('chess-piece');
queen.setAttribute('piece', 'q');
queen.setAttribute('color', 'w');
e4Square.appendChild(queen);

// Or use the setPiece method
const king = document.createElement('chess-piece');
king.setPiece('k', 'b');
e4Square.appendChild(king);
```

### Board with Labels Hidden

```html
<chess-board hide-labels></chess-board>
```

### FEN / FFEN Support

The chess board accepts a single `fen` attribute that works with either standard Forsyth-Edwards Notation (FEN) or the fairy-aware FFEN format used for composed chess problems and custom piece metadata. The parser automatically detects which notation is being used and applies the right rules.

#### Setting Position with FEN or FFEN

```html
<!-- Starting position -->
<chess-board fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"></chess-board>

<!-- Empty board -->
<chess-board fen="8/8/8/8/8/8/8/8 w - - 0 1"></chess-board>

<!-- Custom position -->
<chess-board fen="r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 4 4"></chess-board>

<!-- Fairy-aware FFEN string: format is detected automatically -->
<chess-board fen="8/8/8/8/8/8/8/8 w - - 0 1 e4:gn:Chameleon"></chess-board>
```

The board keeps the internal state synchronized automatically: when the position contains fairy metadata, it preserves it in the returned FFEN-compatible string; otherwise it remains a standard FEN string. There is no separate `ffen` attribute or duplicate state to keep in sync.

#### Board Rotation Based on Active Color

The board automatically rotates 180 degrees when it's black's turn to move:

```html
<!-- White to move - normal orientation -->
<chess-board fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"></chess-board>

<!-- Black to move - rotated 180 degrees -->
<chess-board fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1"></chess-board>
```

This provides a better user experience by orienting the board from the perspective of the player whose turn it is.

#### Programmatic FEN / FFEN Control

```javascript
const board = document.querySelector('chess-board');

// Standard FEN
board.setFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

// Fairy-aware FFEN string (auto-detected)
board.setFen('8/8/8/8/8/8/8/8 w - - 0 1 e4:gn:Chameleon');

const currentPosition = board.getFen();
// Returns the current board state in the appropriate FEN/FFEN form
// without requiring a separate ffen attribute or getter.

// Set starting position
board.setStartingPosition();

// Clear all pieces
board.clearBoard();
```

### Cell Click Events

Listen for cell clicks to interact with the board:

```javascript
const board = document.querySelector('chess-board');

// Listen for cell click events
board.addEventListener('cellClick', (event) => {
  const { cell, piece } = event.detail;
  
  if (piece) {
    console.log(`Clicked ${cell} - ${piece.color} ${piece.type}`);
  } else {
    console.log(`Clicked ${cell} - Empty square`);
  }
});

// Example output:
// Clicked e4 - white p
// Clicked a1 - Empty square
```

### Keyboard Navigation

The board supports keyboard navigation for accessibility:

```javascript
const board = document.querySelector('chess-board');

// Focus the board (can be done with Tab key)
board.shadowRoot.querySelector('.board').focus();

// Get current selected square
const current = board.getCurrentSquare();
console.log('Current square:', current); // e.g., "a1"

// Programmatically select a square
board.selectSquare('e4');

// Programmatically select the piece on a square
const wasSelected = board.selectPiece('e4');
console.log(wasSelected); // true when e4 contains a piece
```

### Programmatic Piece Management

```javascript
// Create a piece
const piece = document.createElement('chess-piece');
piece.setPiece('r', 'w'); // White rook

// Create fairy pieces
const empress = document.createElement('chess-piece');
empress.setPiece('e', 'b'); // Black empress

const neutralAngel = document.createElement('chess-piece');
neutralAngel.setPiece('a', 'n'); // Neutral angel/archbishop

// Change piece type and color
piece.setAttribute('piece', 'q'); // Change to queen
piece.setAttribute('color', 'b'); // Change to black

// Get current piece info
console.log(piece.getPiece()); // 'q'
console.log(piece.getColor()); // 'b'
```

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Testing
pnpm run test           # Run tests in watch mode
pnpm run test:run       # Run tests once
pnpm run test:coverage  # Run tests with coverage

# Linting
pnpm run lint           # Check code style
pnpm run lint:fix       # Auto-fix linting issues

# Type checking
pnpm run type-check          # Check all TypeScript configurations
pnpm run type-check:lib      # Check library source files
pnpm run type-check:node     # Check configuration files
pnpm run type-check:test     # Check test files
```

## TypeScript Configuration

The project uses a modular TypeScript configuration:

- **`tsconfig.json`**: Main configuration that references all others
- **`tsconfig.lib.json`**: Library source files configuration
- **`tsconfig.node.json`**: Build tools and configuration files
- **`tsconfig.test.json`**: Test files configuration

## Testing

The project uses **Vitest** with **Happy DOM** for testing web components.

### Test Structure

```text
test/
├── setup.ts              # Global test setup
├── ChessBoard.test.ts    # ChessBoard component tests
└── ChessPiece.test.ts    # ChessPiece component tests
```

### Writing Tests

Tests are written using Vitest's API with Happy DOM providing a browser-like environment:

```typescript
import { describe, it, expect } from 'vitest';

describe('Component Name', () => {
  it('should work correctly', () => {
    // Test implementation
  });
});
```

### Test Commands

- `pnpm run test`: Run tests in watch mode during development
- `pnpm run test:run`: Run tests once (CI/CD)
- `pnpm run test:coverage`: Run tests with coverage report

## API

### ChessBoard Component

The `chess-board` element renders a complete 8x8 chess board with:

- **Board Layout**: CSS Grid-based 10x10 grid (8x8 board squares + labels on all sides)
- **Data Coordinates**: Each square has a `data-coordinate` attribute (a1-h8)
- **Board Labels**: Column letters (a-h) on top and bottom, row numbers (8-1) on left and right sides
- **Responsive Sizing**: Board adapts to container width while maintaining a minimum size of 200px x 200px
- **Font Scaling**: Piece and label font sizes scale proportionally with board size using `cqw` units
- **Container Queries**: Uses `container-type: inline-size` for modern responsive design
- **Shadow DOM**: Isolated styles and markup for safe integration
- **Event Cleanup**: Automatically removes event listeners when disconnected from DOM to prevent memory leaks
- **Keyboard Navigation**: Arrow keys navigate between squares, focus selects default square
- **Current Square Selection**: Visual indication of selected square with green outline

#### Attributes

- `hide-labels`: When present, hides all coordinate labels, showing only the chess board squares
- `fen`: Standard FEN or FFEN string to set the board position. The component auto-detects whether the input is a normal FEN or a fairy-aware FFEN string.

#### Methods

##### FEN / FFEN Management

- `setFen(fenOrFfen: string)`: Set board position using either standard FEN or FFEN notation; format is inferred automatically
- `getFen(): string`: Get the current board state as the active FEN/FFEN string, preserving fairy metadata when present
- `setStartingPosition()`: Set board to standard starting position
- `clearBoard()`: Remove all pieces from the board

> There is a single `fen` API now. FFEN support is handled automatically by the same attribute and method, so there is no separate `ffen` state to synchronize.

##### Square Selection

- `getCurrentSquare(): string | null`: Get currently selected square coordinate
- `selectSquare(coordinate: string)`: Set currently selected square
- `getSelectedPieceSquare(): string | null`: Get the selected piece's square, if any
- `selectPiece(coordinate: string): boolean`: Set the current square and select its piece. Returns `true` when the square contains a piece; otherwise clears the current piece selection and returns `false`. Throws an error for an invalid coordinate.

##### Programmatic Piece Manipulation

The chess board provides a complete API for programmatic manipulation of pieces, allowing you to build chess applications without relying on keyboard input:

###### Adding and Removing Pieces

```typescript
// Get the chess board element
const board = document.querySelector('chess-board') as ChessBoard;

// Add a piece to a square
board.addPiece('e4', 'q', 'w');              // White queen on e4
board.addPiece('d4', 'k', 'b', '45');        // Black king on d4, rotated 45°

// Remove a piece from a square
board.removePiece('e4');                     // Remove piece from e4

// Check if a square has a piece
if (board.hasPiece('d4')) {
  console.log('Square d4 is occupied');
}

// Get piece information
const piece = board.getPieceAt('d4');
if (piece) {
  console.log(`Piece at d4: ${piece.color} ${piece.type}, rotation: ${piece.rotation}`);
  // Output: "Piece at d4: b k, rotation: 45"
}
```

**Methods:**

- `addPiece(square: string, type: ChessPieceType, color: ChessPieceColor, rotation?: ChessPieceRotation): void`
  - Adds a piece to the specified square (replaces existing piece if present)
  - Throws `Error` if square coordinate is invalid
- `removePiece(square: string): void`
  - Removes piece from the specified square (no-op if square is empty)
  - Throws `Error` if square coordinate is invalid
- `hasPiece(square: string): boolean`
  - Returns `true` if square has a piece, `false` if empty
  - Throws `Error` if square coordinate is invalid
- `getPieceAt(square: string): Omit<PieceInfo, 'square'> | null`
  - Returns piece information or `null` if square is empty
  - Throws `Error` if square coordinate is invalid

###### Bulk Operations

```typescript
// Get all pieces on the board
const pieces = board.getAllPieces();
console.log(`Board has ${pieces.length} pieces`);
pieces.forEach(piece => {
  console.log(`${piece.color} ${piece.type} on ${piece.square}`);
});

// Set multiple pieces at once (clears board first)
board.setPieces([
  { square: 'e1', type: 'k', color: 'w', rotation: '0' },
  { square: 'e8', type: 'k', color: 'b', rotation: '0' },
  { square: 'd1', type: 'q', color: 'w', rotation: '45' },
  { square: 'd8', type: 'q', color: 'b' }  // rotation is optional
]);
```

**Methods:**

- `getAllPieces(): PieceInfo[]`
  - Returns array of all pieces currently on the board
  - Each item includes `square`, `type`, `color`, and `rotation`
- `setPieces(pieces: Array<Omit<PieceInfo, 'rotation'> & { rotation?: ChessPieceRotation }>): void`
  - Clears board and sets multiple pieces at once
  - Validates all coordinates before making any changes
  - Throws `Error` if any coordinate is invalid

###### Piece Rotation

```typescript
// Rotate piece by relative amount
board.addPiece('e4', 'n', 'w', '0');
board.rotatePiece('e4', 45);                // Rotate clockwise by 45°
board.rotatePiece('e4', -45);               // Rotate counter-clockwise by 45°
board.rotatePiece('e4', 100);               // Rounds to nearest 45° (becomes 90°)

// Set absolute rotation
board.setPieceRotation('e4', '180');        // Set to 180°

// Get current rotation
const rotation = board.getPieceRotation('e4');
console.log(`Rotation: ${rotation}°`);
```

**Methods:**

- `rotatePiece(square: string, degrees: number): void`
  - Rotates piece by relative amount (rounds to nearest 45°)
  - Throws `Error` if square is invalid or empty
- `setPieceRotation(square: string, rotation: ChessPieceRotation): void`
  - Sets absolute rotation (0, 45, 90, 135, 180, 225, 270, 315)
  - Throws `Error` if square is invalid or empty
- `getPieceRotation(square: string): ChessPieceRotation | null`
  - Returns current rotation or `null` if square is empty
  - Throws `Error` if square coordinate is invalid

###### Board Orientation

```typescript
// Set board orientation
board.setOrientation('white');              // White at bottom (default)
board.setOrientation('black');              // Black at bottom (rotated 180°)

// Get current orientation
const orientation = board.getOrientation(); // 'white' | 'black'

// Toggle orientation
board.toggleOrientation();                  // Switch between white/black
```

**Methods:**

- `setOrientation(orientation: 'white' | 'black'): void`
  - Sets which side is at the bottom of the board
- `getOrientation(): 'white' | 'black'`
  - Returns current board orientation
- `toggleOrientation(): void`
  - Switches between white and black orientation

###### TypeScript Types

```typescript
import type { PieceInfo, ChessPieceType, ChessPieceColor, ChessPieceRotation } from '@dardino/chess-board';

interface PieceInfo {
  square: string;                           // e.g., 'e4', 'a1'
  type: ChessPieceType;                     // 'k' | 'q' | 'r' | 'b' | 'n' | 'p' | 'e' | 't' | 'a'
  color: ChessPieceColor;                   // 'w' | 'b' | 'n'
  rotation: ChessPieceRotation;             // '0' | '45' | '90' | '135' | '180' | '225' | '270' | '315'
}
```

###### Complete Example

```typescript
import { ChessBoard, type PieceInfo } from '@dardino/chess-board';

// Setup a chess problem
const board = document.querySelector('chess-board') as ChessBoard;

// Clear board and add specific position
board.clearBoard();
board.addPiece('e1', 'k', 'w');
board.addPiece('e8', 'k', 'b');
board.addPiece('h7', 'q', 'w', '45');  // Rotated queen for problem composition

// Animate piece rotation
let currentRotation = 0;
setInterval(() => {
  currentRotation = (currentRotation + 45) % 360;
  board.setPieceRotation('h7', currentRotation.toString() as ChessPieceRotation);
}, 500);

// Save and restore position
const savedPosition = board.getAllPieces();
// ... later ...
board.setPieces(savedPosition);

// Check position validity
function hasKing(color: 'w' | 'b'): boolean {
  return board.getAllPieces().some(p => p.type === 'k' && p.color === color);
}

if (!hasKing('w') || !hasKing('b')) {
  console.warn('Invalid position: missing king(s)');
}
```

###### HTML Example

Complete HTML page with programmatic API usage:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chess Board - Programmatic API Demo</title>
  
  <!-- Load chess piece font -->
  <link rel="stylesheet" href="./assets/ScacchiPainter.css" />
  
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    
    chess-board {
      width: 100%;
      max-width: 500px;
      display: block;
      margin: 2rem auto;
    }
    
    .controls {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      justify-content: center;
      margin: 1rem 0;
    }
    
    button {
      padding: 0.5rem 1rem;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <h1>Chess Board - Programmatic API Demo</h1>
  
  <chess-board id="board"></chess-board>
  
  <div class="controls">
    <button onclick="addQueenE4()">Add Queen on e4</button>
    <button onclick="rotateE4()">Rotate e4 +45°</button>
    <button onclick="removeE4()">Remove e4</button>
    <button onclick="setupPosition()">Setup Position</button>
    <button onclick="clearBoard()">Clear Board</button>
  </div>
  
  <div id="info"></div>
  
  <script type="module">
    import '@dardino/chess-board';
    
    const board = document.getElementById('board');
    const info = document.getElementById('info');
    
    // Add queen on e4
    window.addQueenE4 = () => {
      board.addPiece('e4', 'q', 'w');
      updateInfo();
    };
    
    // Rotate piece on e4
    window.rotateE4 = () => {
      if (board.hasPiece('e4')) {
        board.rotatePiece('e4', 45);
        updateInfo();
      } else {
        alert('No piece on e4!');
      }
    };
    
    // Remove piece from e4
    window.removeE4 = () => {
      board.removePiece('e4');
      updateInfo();
    };
    
    // Setup a test position
    window.setupPosition = () => {
      board.setPieces([
        { square: 'e1', type: 'k', color: 'w', rotation: '0' },
        { square: 'e8', type: 'k', color: 'b', rotation: '0' },
        { square: 'd1', type: 'q', color: 'w', rotation: '0' },
        { square: 'e4', type: 'n', color: 'w', rotation: '45' }
      ]);
      updateInfo();
    };
    
    // Clear board
    window.clearBoard = () => {
      board.clearBoard();
      updateInfo();
    };
    
    // Update info display
    function updateInfo() {
      const pieces = board.getAllPieces();
      info.innerHTML = `<strong>Pieces on board (${pieces.length}):</strong><br>` +
        pieces.map(p => `${p.square}: ${p.color} ${p.type} (${p.rotation}°)`).join('<br>');
    }
    
    // Initial update
    updateInfo();
  </script>
</body>
</html>
```

###### TypeScript Example

Complete TypeScript example with type safety:

```typescript
import { ChessBoard, type PieceInfo, type ChessPieceType, type ChessPieceColor } from '@dardino/chess-board';

// Get board element with proper typing
const board = document.querySelector('chess-board') as ChessBoard;

// Example 1: Add pieces with validation
function addPieceWithValidation(square: string, type: ChessPieceType, color: ChessPieceColor): void {
  try {
    board.addPiece(square, type, color);
    console.log(`Added ${color} ${type} on ${square}`);
  } catch (error) {
    console.error(`Failed to add piece: ${error.message}`);
  }
}

// Example 2: Animate piece rotation
function animateRotation(square: string, duration: number = 2000): void {
  if (!board.hasPiece(square)) {
    console.error(`No piece on ${square} to animate`);
    return;
  }
  
  const steps = 8; // 8 steps = 360° / 45°
  const interval = duration / steps;
  let step = 0;
  
  const animation = setInterval(() => {
    if (step >= steps) {
      clearInterval(animation);
      return;
    }
    
    try {
      board.rotatePiece(square, 45);
      step++;
    } catch (error) {
      console.error('Animation stopped:', error.message);
      clearInterval(animation);
    }
  }, interval);
}

// Example 3: Position validator
interface PositionValidation {
  isValid: boolean;
  errors: string[];
}

function validatePosition(): PositionValidation {
  const pieces = board.getAllPieces();
  const errors: string[] = [];
  
  // Check for kings
  const whiteKings = pieces.filter(p => p.type === 'k' && p.color === 'w');
  const blackKings = pieces.filter(p => p.type === 'k' && p.color === 'b');
  
  if (whiteKings.length === 0) errors.push('Missing white king');
  if (whiteKings.length > 1) errors.push('Multiple white kings');
  if (blackKings.length === 0) errors.push('Missing black king');
  if (blackKings.length > 1) errors.push('Multiple black kings');
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Example 4: Save and load positions
class PositionManager {
  private savedPositions: Map<string, PieceInfo[]> = new Map();
  
  save(name: string): void {
    const position = board.getAllPieces();
    this.savedPositions.set(name, position);
    console.log(`Saved position "${name}" with ${position.length} pieces`);
  }
  
  load(name: string): boolean {
    const position = this.savedPositions.get(name);
    if (!position) {
      console.error(`Position "${name}" not found`);
      return false;
    }
    
    board.setPieces(position);
    console.log(`Loaded position "${name}"`);
    return true;
  }
  
  list(): string[] {
    return Array.from(this.savedPositions.keys());
  }
}

// Example 5: Interactive piece placement
class PiecePlacer {
  private selectedPieceType: ChessPieceType = 'p';
  private selectedPieceColor: ChessPieceColor = 'w';
  
  constructor(private board: ChessBoard) {
    this.setupClickHandler();
  }
  
  selectPiece(type: ChessPieceType, color: ChessPieceColor): void {
    this.selectedPieceType = type;
    this.selectedPieceColor = color;
    console.log(`Selected: ${color} ${type}`);
  }
  
  private setupClickHandler(): void {
    this.board.addEventListener('cellClick', (event: CustomEvent) => {
      const { cell } = event.detail;
      
      try {
        this.board.addPiece(cell, this.selectedPieceType, this.selectedPieceColor);
        console.log(`Placed ${this.selectedPieceColor} ${this.selectedPieceType} on ${cell}`);
      } catch (error) {
        console.error(`Failed to place piece: ${error.message}`);
      }
    });
  }
}

// Usage examples
addPieceWithValidation('e4', 'q', 'w');
addPieceWithValidation('d4', 'n', 'b');

// Start rotation animation on e4
animateRotation('e4', 2000);

// Validate current position
const validation = validatePosition();
if (!validation.isValid) {
  console.warn('Invalid position:', validation.errors);
}

// Position management
const manager = new PositionManager();
manager.save('opening');
// ... make changes ...
manager.load('opening'); // restore

// Interactive placement
const placer = new PiecePlacer(board);
placer.selectPiece('q', 'w'); // Now clicking board places white queens
```

#### Events

- `cellClick`: Fired when a board square is clicked
  - **Detail**: `{ cell: string, piece?: CellClickPiece }`
  - **cell**: Square coordinate in algebraic notation (e.g., "e4", "a1")
  - **piece**: Optional piece information if present on the square
    - `color`: "white" | "black" | "neutral"
    - `type`: Piece type ("p", "r", "n", "b", "q", "k", "e", "t", "a")
    - `rotation?`: Piece rotation in degrees (0-315)
    - `fairyName?`: Fairy chess name annotation (if present)
    - `fairyCondition?`: Fairy chess condition annotation (if present)

#### Keyboard Navigation

The chess board supports comprehensive keyboard navigation when focused:

- **Focus**: Tab to focus the board, automatically selects "a1" if no square is selected
- **Arrow Keys**: Navigate between squares
  - `↑/↓`: Move along ranks (rows), direction respects board rotation
  - `←/→`: Move along files (columns)
- **Space / Enter**: Select, deselect, or move the piece on the current square
- **Delete**: Remove piece from current square
- **Escape**: Clear all pieces from the board
- **Shift+Escape**: Reset board to starting position
- **Piece Keys**: Add or replace piece on current square
  - **White pieces**: `P`, `R`, `N`, `B`, `Q`, `K` (uppercase)
  - **Black pieces**: `p`, `r`, `n`, `b`, `q`, `k` (lowercase)
  - **Fairy pieces**: `E/e` (Empress), `T/t` (Dragon), `A/a` (Angel/Archbishop)
- **Piece Rotation** (Alt/Option + Arrow): Rotate piece on current square
  - `Alt+←` / `Option+←`: Rotate counter-clockwise by 45°
  - `Alt+→` / `Option+→`: Rotate clockwise by 45°
  - `Alt+↑` / `Option+↑`: Reset rotation to 0°
  - `Alt+↓` / `Option+↓`: Set rotation to 180°
- **Cell Decorators** (Programmatic API): Add an internal overlay to any square under the piece layer
  - `setCellDecorators({ e4: { backgroundColor: '#ffeb3b', innerBorder: 'solid 2px #d97706' } })`
- **Board Flip** (Shift + Arrow): Change board orientation
  - `Shift+↑`: White perspective (normal)
  - `Shift+↓`: Black perspective (rotated 180°)
- **Click**: Click any square to select it
- **Visual Feedback**: Selected square shows green outline when board is focused

#### Methods

#### CSS Variables

```css
chess-board {
  --chess-border-color: #000;
  --chess-light-square: #f0d9b5;
  --chess-dark-square: #b58863;
  --chess-piece-color: #333;
  --chess-piece-bg: #fff;
}
```

### ChessPiece Component

The `chess-piece` element renders an individual chess piece with support for rotation and fairy chess notation.

#### Attributes

- `piece`: Piece type (`k`, `q`, `r`, `b`, `n`, `p`, `e`, `t`, `a`)
- `color`: Piece color (`w` for white, `b` for black, `n` for neutral)
- `rotation`: Piece rotation in degrees (0, 45, 90, 135, 180, 225, 270, 315)
- `fairy-name`: Fairy chess name annotation (max 3 characters, displayed top-left)
- `fairy-condition`: Fairy chess condition annotation (displayed bottom-right)

#### Methods

- `setPiece(piece: ChessPieceType, color: ChessPieceColor)`: Set piece type and color
- `getPiece(): ChessPieceType`: Get current piece type
- `getColor(): ChessPieceColor`: Get current piece color
- `setRotation(degrees: ChessPieceRotation)`: Set piece rotation
- `getRotation(): ChessPieceRotation`: Get current rotation
- `setFairyName(name: string)`: Set fairy name (max 3 chars)
- `getFairyName(): string`: Get fairy name
- `setFairyCondition(condition: string)`: Set fairy condition
- `getFairyCondition(): string`: Get fairy condition

#### Types

```typescript
type ChessPieceType = 'k' | 'q' | 'r' | 'b' | 'n' | 'p' | 'e' | 't' | 'a';
type ChessPieceColor = 'w' | 'b' | 'n';
type ChessPieceRotation = 0 | 45 | 90 | 135 | 180 | 225 | 270 | 315;
```

#### Examples

```html
<!-- Rotated piece -->
<chess-piece piece="n" color="w" rotation="90"></chess-piece>

<!-- Fairy chess notation -->
<chess-piece piece="e" color="w" fairy-name="EMP" fairy-condition="(a)"></chess-piece>

<!-- Combined rotation and fairy notation -->
<chess-piece piece="t" color="b" rotation="45" fairy-name="T" fairy-condition="(h)"></chess-piece>
```

## FEN Utilities

The library provides comprehensive utilities for working with Forsyth-Edwards Notation.

### FEN Format

FEN uses the format: `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`

- **Piece placement**: 8 ranks separated by `/`, empty squares as numbers
- **Active color**: `w` (white) or `b` (black)
- **Castling rights**: `KQkq` (kingside/queenside for both colors) or `-`
- **En passant target**: Square coordinate or `-`
- **Halfmove clock**: Moves since last capture/pawn advance
- **Fullmove number**: Current move number

### Piece Notation

| Piece | White | Black | Description |
| ------- | ------- | ------- | ------------- |
| King | `K` | `k` | King |
| Queen | `Q` | `q` | Queen |
| Rook | `R` | `r` | Rook |
| Bishop | `B` | `b` | Bishop |
| Knight | `N` | `n` | Knight |
| Pawn | `P` | `p` | Pawn |

### FEN Functions

```typescript
import { parseFen, positionToFen, parsePiecePlacement, piecesToFenString, getStartingPositionFen, getEmptyBoardFen } from '@dardino/chess-board';

// Parse complete FEN string
const position = parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
console.log(position?.pieces.length); // 32
console.log(position?.activeColor); // 'w'

// Convert position back to FEN
const fen = positionToFen(position);

// Parse only piece placement
const pieces = parsePiecePlacement('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
console.log(pieces.length); // 32

// Convert pieces back to FEN string
const pieceFen = piecesToFenString(pieces);
console.log(pieceFen); // 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'

// Get standard positions
const startingFen = getStartingPositionFen();
const emptyFen = getEmptyBoardFen();
```

### Types

```typescript
interface ChessPiece {
  type: ChessPieceType;
  color: ChessPieceColor;
  square: string; // e.g., 'e4', 'a1'
}

interface FenPosition {
  pieces: ChessPiece[];
  activeColor: 'w' | 'b';
  castlingRights: string;
  enPassantTarget: string;
  halfmoveClock: number;
  fullmoveNumber: number;
}
```

### Examples

#### Parse Starting Position

```typescript
const startingPosition = parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

console.log(startingPosition.pieces.find(p => p.square === 'e1'));
// { type: 'k', color: 'w', square: 'e1' }

console.log(startingPosition.pieces.find(p => p.square === 'e8'));
// { type: 'k', color: 'b', square: 'e8' }
```

#### Create Custom Position

```typescript
const customPieces: ChessPiece[] = [
  { type: 'k', color: 'w', square: 'e1' },
  { type: 'q', color: 'w', square: 'd1' },
  { type: 'k', color: 'b', square: 'e8' }
];

const customFen = piecesToFenString(customPieces);
console.log(customFen); // '4k3/8/8/8/8/8/8/3QK3'
```

#### Validate FEN

```typescript
const validPosition = parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
const invalidPosition = parseFen('invalid-fen');

console.log(validPosition !== null); // true
console.log(invalidPosition === null); // true
```

## Responsive Behavior

The chess board automatically adapts to its container size using modern **CSS Container Queries**:

- **Container Type**: `inline-size` for width-based responsive design
- **Grid Layout**: 10x10 CSS Grid (8x8 board squares + border labels on all sides)
- **Font Scaling**:
  - Pieces: `12.5cqw` for squares, `0.8em` for pieces (80% of square font size)
  - Labels: `8cqw` for column/row labels on all sides
- **Aspect Ratio**: Maintains perfect square proportions with `aspect-ratio: 1`
- **Minimum Size**: 200px x 200px to ensure readability

### Label Positioning

Standard chess notation labels on all four sides:

- **Top & Bottom**: Column letters (a-h) for coordinate reference
- **Left & Right**: Row numbers (8-1) for coordinate reference
- **Orientation**: Viewed from white player's perspective (8th rank at top, 1st rank at bottom)
- **Symmetry**: Labels duplicated on opposite sides for better readability

### Container Query Implementation

```css
.board {
  container-type: inline-size;
  display: grid;
  grid-template-columns: repeat(10, 1fr); /* 10 columns for labels + board */
  grid-template-rows: repeat(10, 1fr);    /* 10 rows for labels + board */
}

.square {
  font-size: 12.5cqw; /* Scales with container width */
}

.label {
  font-size: 8cqw; /* Smaller labels that also scale */
}
```

This ensures the chess board remains perfectly proportioned and readable at any size while providing comprehensive chess notation reference.
