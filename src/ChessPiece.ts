/**
 * ChessPiece Web Component
 * A custom element for displaying individual chess pieces
 */
import style from './ChessPiece.css?raw';
import template from './ChessPiece.html?raw';
import { ChessPieceColor, ChessPieceRotation, ChessPieceType, FairyPieceMetadata, StandardPieces, StandardPiecesList } from './fen';

const standardPieceNames = {
  k: 'King',
  q: 'Queen',
  r: 'Rook',
  b: 'Bishop',
  n: 'Knight',
  p: 'Pawn',
  e: 'Empress',
  t: 'Amazon',
  a: 'Archbishop',
  c: 'Circle',
  s: 'Square',
  x: 'Cross',
} as const;

// Augment DOM typings so addEventListener/removeEventListener recognize the custom 'cellClick' event
declare global {
  interface HTMLElementEventMap {
    "fairy-metadata-changed": CustomEvent<FairyPieceMetadata>;
  }
}

export class ChessPiece extends HTMLElement {
  #shadow: ShadowRoot;
  #pieceType: ChessPieceType = 'p';
  #pieceColor: ChessPieceColor = 'w';
  #rotation: ChessPieceRotation = '0';
  #fairyName: string = '';
  #fairyCondition: string = '';

  get #isStandardPiece(): boolean {
    return StandardPiecesList.includes(this.#pieceType as typeof StandardPiecesList[number]);
  }

  get #trimmedPieceType(): string {
    return this.#pieceType?.replace(/^'+/, '') ?? ""; // Remove leading apostrophes for fairy pieces
  }

  static get observedAttributes(): string[] {
    return ['piece', 'color', 'rotation', 'fairy-name', 'fairy-condition'];
  }

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this.#updatePieceAttributes();
    this.#render();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (oldValue !== newValue) {
      this.#updatePieceAttributes();
      this.#render();
    }
  }

  #isValidPieceType(piece: string | null): piece is ChessPieceType {
    return piece !== null && (
      StandardPiecesList.includes(piece as StandardPieces) 
      || /^'[a-zA-Z0-9]+$/.test(piece) 
      || /^''[a-zA-Z0-9]{2}$/.test(piece)
    );
  }

  #updatePieceAttributes(): void {
    const piece = this.getAttribute('piece') as ChessPieceType;
    const color = this.getAttribute('color') as ChessPieceColor;
    const rotation = this.getAttribute('rotation') as ChessPieceRotation;
    const fairyName = this.getAttribute('fairy-name');
    const fairyCondition = this.getAttribute('fairy-condition');

    if (this.#isValidPieceType(piece))
      this.#pieceType = piece;

    if (color && ['w', 'b', 'n'].includes(color)) {
      this.#pieceColor = color;
    }

    if (rotation && ['0', '45', '90', '135', '180', '225', '270', '315'].includes(rotation)) {
      this.#rotation = rotation;
    } else {
      this.#rotation = '0';
    }

    // Validate fairy-name: max 3 characters
    if (fairyName !== null) {
      this.#fairyName = fairyName.slice(0, 3);
    } else {
      this.#fairyName = '';
    }

    if (fairyCondition !== null) {
      this.#fairyCondition = fairyCondition;
    } else {
      this.#fairyCondition = '';
    }
  }

  #render(): void {
    // Clear existing content
    this.#shadow.innerHTML = '';

    // Add styles
    const styleElement = document.createElement('style');
    styleElement.textContent = style;
    this.#shadow.appendChild(styleElement);

    // Create container from imported HTML template
    const templateContainer = document.createElement('div');
    templateContainer.innerHTML = template;

    // Clone the template content
    const templateElement = templateContainer.querySelector('template');
    if (templateElement) {
      const clonedContent = templateElement.content.cloneNode(true) as DocumentFragment;

      // Update piece content
      const pieceContainer = clonedContent.querySelector('.piece') as HTMLElement;
      const bgElement = clonedContent.querySelector('.piece-bg') as HTMLElement;
      const fgElement = clonedContent.querySelector('.piece-fg') as HTMLElement;
      const fairyNameElement = clonedContent.querySelector('.fairy-name') as HTMLElement;
      const fairyConditionElement = clonedContent.querySelector('.fairy-condition') as HTMLElement;
      const pieceInner = pieceContainer.querySelector('.piece-inner') as HTMLElement | null;

      if (!bgElement || !fgElement || !pieceContainer || !pieceInner) return;

      if (!this.#isStandardPiece) {
        bgElement.textContent = this.#trimmedPieceType.toUpperCase(); // admit only uppercase characters for fairy pieces
        fgElement.textContent = this.#trimmedPieceType.toUpperCase();
      } else {
        bgElement.textContent = `__${this.#trimmedPieceType}`; // For standard pieces, prefix with '__'
        fgElement.textContent = `${this.#pieceColor}_${this.#trimmedPieceType}`; // For standard pieces, prefix with color
      }

      if (this.#pieceType?.startsWith("'")) {
        // For fairy pieces, add a special class to the piece container
        pieceContainer.classList.add('text-piece');
      }

      // Apply color class
      pieceInner.classList.add(`color-${this.#pieceColor}`);
      // Apply rotation
      if (this.#rotation !== '0') {
        pieceInner.style.transform = `rotate(${this.#rotation}deg)`;
        pieceInner.classList.add('rotated');
      }

      // Update fairy-name
      if (fairyNameElement) {
        if (this.#fairyName) {
          fairyNameElement.textContent = this.#fairyName;
          fairyNameElement.style.display = 'block';
        } else {
          fairyNameElement.style.display = 'none';
        }
      }

      // Update fairy-condition
      if (fairyConditionElement) {
        if (this.#fairyCondition) {
          fairyConditionElement.textContent = this.#fairyCondition;
          fairyConditionElement.style.display = 'block';
        } else {
          fairyConditionElement.style.display = 'none';
        }
      }

      pieceContainer?.setAttribute('title', this.getHumanReadableTitle());

      this.#shadow.appendChild(clonedContent);
    }
  }

  // Public methods to set piece programmatically
  setPiece(piece: ChessPieceType, color: ChessPieceColor): void {
    this.setAttribute('piece', piece);
    this.setAttribute('color', color);
  }

  getPiece(): ChessPieceType {
    return this.#pieceType;
  }

  getColor(): ChessPieceColor {
    return this.#pieceColor;
  }

  getRotation(): ChessPieceRotation {
    return this.#rotation;
  }

  setRotation(rotation: ChessPieceRotation): void {
    this.setAttribute('rotation', rotation);
  }

  getFairyName(): string {
    return this.#fairyName;
  }

  setFairyName(name: string): void {
    this.setAttribute('fairy-name', name);
    this.#triggerMetadataChangeEvent(this.#merge({ fairyName: name || undefined }));
  }

  getFairyCondition(): string {
    return this.#fairyCondition;
  }

  setFairyCondition(condition: string): void {
    this.setAttribute('fairy-condition', condition);
    this.#triggerMetadataChangeEvent(this.#merge({ fairyCondition: condition || undefined }));
  }

  getHumanReadableTitle(): string {
    let title = '';
    if (this.#pieceColor === 'w') {
      title += 'White ';
    } else if (this.#pieceColor === 'b') {
      title += 'Black ';
    } else if (this.#pieceColor === 'n') {
      title += 'Neutral ';
    }

    if (this.#isStandardPiece) {
      title += standardPieceNames[this.#pieceType.toLowerCase() as keyof typeof standardPieceNames] 
            || `Unknown Piece (${this.#trimmedPieceType})`;
    } else {
      title += `Fairy Piece (${this.#trimmedPieceType})`;
    }

    if (this.#fairyName) {
      title += ` - Name: ${this.#fairyName}`;
    }
    if (this.#fairyCondition) {
      title += ` - Condition: ${this.#fairyCondition}`;
    }

    return title;
  }

  #merge(metadata: Partial<FairyPieceMetadata>): FairyPieceMetadata {
    return Object.assign({}, {
      fairyName: (metadata.fairyName ?? this.#fairyName) || undefined,
      fairyCondition: (metadata.fairyCondition ?? this.#fairyCondition) || undefined,
    });
  }

  #triggerMetadataChangeEvent(detail: FairyPieceMetadata): void {
    const event = new CustomEvent('fairy-metadata-changed', {
      detail,
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }
}

// Register the custom element
if (!customElements.get('chess-piece')) {
  customElements.define('chess-piece', ChessPiece);
}
