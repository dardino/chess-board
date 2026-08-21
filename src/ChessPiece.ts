/**
 * ChessPiece Web Component
 * A custom element for displaying individual chess pieces
 */
import style from './ChessPiece.css?raw';
import template from './ChessPiece.html?raw';

export type ChessPieceType = 'k' | 'q' | 'r' | 'b' | 'n' | 'p' | 'e' | 't' | 'a' | 'c' | 'x' | 's';
export type ChessPieceColor = 'w' | 'b' | 'n';
export type ChessPieceRotation = '0' | '45' | '90' | '135' | '180' | '225' | '270' | '315';

export class ChessPiece extends HTMLElement {
  private shadow: ShadowRoot;
  private pieceType: ChessPieceType = 'p';
  private pieceColor: ChessPieceColor = 'w';
  private rotation: ChessPieceRotation = '0';
  private fairyName: string = '';
  private fairyCondition: string = '';

  static get observedAttributes(): string[] {
    return ['piece', 'color', 'rotation', 'fairy-name', 'fairy-condition'];
  }

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this.updatePieceAttributes();
    this.render();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (oldValue !== newValue) {
      this.updatePieceAttributes();
      this.render();
    }
  }

  private updatePieceAttributes(): void {
    const piece = this.getAttribute('piece') as ChessPieceType;
    const color = this.getAttribute('color') as ChessPieceColor;
    const rotation = this.getAttribute('rotation') as ChessPieceRotation;
    const fairyName = this.getAttribute('fairy-name');
    const fairyCondition = this.getAttribute('fairy-condition');

    if (piece && ['k', 'q', 'r', 'b', 'n', 'p', 'e', 't', 'a', 'c', 'x', 's'].includes(piece)) {
      this.pieceType = piece;
    }

    if (color && ['w', 'b', 'n'].includes(color)) {
      this.pieceColor = color;
    }

    if (rotation && ['0', '45', '90', '135', '180', '225', '270', '315'].includes(rotation)) {
      this.rotation = rotation;
    } else {
      this.rotation = '0';
    }

    // Validate fairy-name: max 3 characters
    if (fairyName !== null) {
      this.fairyName = fairyName.slice(0, 3);
    } else {
      this.fairyName = '';
    }

    if (fairyCondition !== null) {
      this.fairyCondition = fairyCondition;
    } else {
      this.fairyCondition = '';
    }
  }

  private render(): void {
    // Clear existing content
    this.shadow.innerHTML = '';

    // Add styles
    const styleElement = document.createElement('style');
    styleElement.textContent = style;
    this.shadow.appendChild(styleElement);

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

      if (bgElement) {
        bgElement.textContent = `__${this.pieceType}`;
      }
      if (fgElement) {
        fgElement.textContent = `${this.pieceColor}_${this.pieceType}`;
      }

      // Apply rotation
      if (pieceContainer && this.rotation !== '0') {
        pieceContainer.style.transform = `rotate(${this.rotation}deg)`;
      }

      // Update fairy-name
      if (fairyNameElement) {
        if (this.fairyName) {
          fairyNameElement.textContent = this.fairyName;
          fairyNameElement.style.display = 'block';
        } else {
          fairyNameElement.style.display = 'none';
        }
      }

      // Update fairy-condition
      if (fairyConditionElement) {
        if (this.fairyCondition) {
          fairyConditionElement.textContent = this.fairyCondition;
          fairyConditionElement.style.display = 'block';
        } else {
          fairyConditionElement.style.display = 'none';
        }
      }

      this.shadow.appendChild(clonedContent);
    }
  }

  // Public methods to set piece programmatically
  setPiece(piece: ChessPieceType, color: ChessPieceColor): void {
    this.setAttribute('piece', piece);
    this.setAttribute('color', color);
  }

  getPiece(): ChessPieceType {
    return this.pieceType;
  }

  getColor(): ChessPieceColor {
    return this.pieceColor;
  }

  getRotation(): ChessPieceRotation {
    return this.rotation;
  }

  setRotation(rotation: ChessPieceRotation): void {
    this.setAttribute('rotation', rotation);
  }

  getFairyName(): string {
    return this.fairyName;
  }

  setFairyName(name: string): void {
    this.setAttribute('fairy-name', name);
  }

  getFairyCondition(): string {
    return this.fairyCondition;
  }

  setFairyCondition(condition: string): void {
    this.setAttribute('fairy-condition', condition);
  }
}

// Register the custom element
if (!customElements.get('chess-piece')) {
  customElements.define('chess-piece', ChessPiece);
}
