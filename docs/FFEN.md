# Fairy FEN Specification

The following specification assumes that the reader is familiar with the traditional FEN notation. A complete specification for traditional FEN can be found in the main chess literature and the project documentation.

## Supported features

This implementation supports the FFEN extensions used by the chess-board component:

- standard FEN parsing and serialization
- FFEN values with an optional fairy metadata suffix
- neutral pieces and neutral markers using the `-` prefix
- rotated pieces or markers using the `*` prefix with 45° increments
- fairy letter and number glyphs prefixed with `'`
- non-standard board sizes, including rectangular or compact fairy boards

Example values:

- standard FEN: `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`
- FFEN with a neutral piece: `8/8/8/8/8/8/8/-K3 w - - 0 1`
- FFEN with a 90° rotation: `8/8/8/8/4*1B3/8/8/8 w - - 0 1`
- FFEN with fairy metadata: `8/8/8/8/8/8/8/4K3 w - - 0 1 e4:gn:Chameleon`

## General rules

• A chess diagram is specified by a sequence of letters and digits, row by row and column by column, starting in the upper left corner. The rows are separated by "/" signs:

  row8/row7/row6/row5/row4/row3/row2/row1

Note that FFEN supports larger and smaller chess boards as well, for example 4x4 or 11x11 boards.

• Chess pieces are denoted by the letters K (King), Q (Queen), R (Rook), B (Bishop), N (kNight) and P (Pawn); lower case letters denote black pieces; upper case letters denote white pieces; a sequence of empty squares is denoted by a one-digit number specifying the length of the sequence. The starting position is thus specified by:

  rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR

• A marker is specified by the letters C (circle), X (cross), S (square) and T (triangle); lower case letters denote black markers; upper case letters denote white markers. Technically, there is no difference between normal pieces and markers.

• A neutral piece or neutral marker is denoted by prefixing a piece or marker symbol with a "-" sign, e.g. `-B` or `-b` denotes a neutral Bishop. There is no difference between upper and lower case letters.

Example:

  `8/8/8/8/8/8/8/-K3 w - - 0 1`

• A rotated piece or marker is denoted by prefixing a piece or marker symbol with a `*` sign, followed by a number specifying how often the piece should be rotated clockwise in 90° steps. For example, `*1B` denotes a white Bishop rotated by 90°, `*3q` denotes a black Queen rotated by 270°, and `-*2r` denotes a neutral rook rotated by 180°.

Example:

  `8/8/8/8/4*1B3/8/8/8 w - - 0 1`

• A letter is denoted by prefixing it with a `'` sign, e.g. `'a` or `'A`. There are black lower case letters and black upper case letters, but no white or neutral letters. Letters can be rotated.

• A number is denoted by prefixing it with one `'` sign (one-digit number) or two `'` signs (two-digit number), e.g. `'7` or `''23`. Note that `'2'3` and `"23` are different: `'2'3` denotes two squares with the numbers 2 and 3 respectively; `''23` denotes a single square with the number 23. There are black numbers only, no white or neutral numbers. Numbers can be rotated.

Note: Why are two `'` necessary? To avoid ambiguity: `'32` is a square with the number 3 followed by 2 empty squares, while `''32` is a square with the number 32. Unfortunately, `"` cannot be used to denote two-digit numbers because `"` is an HTML delimiter.
