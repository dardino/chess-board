import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ChessPiece, type ChessPieceColor, type ChessPieceRotation, type ChessPieceType } from '../src/ChessPiece';

describe('ChessPiece Web Component', () => {
  let element: ChessPiece;

  beforeEach(() => {
    // Create a new instance for each test
    element = new ChessPiece();
    // Append to document to trigger connectedCallback
    document.body.appendChild(element);
  });

  afterEach(() => {
    // Clean up after each test
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });

  it('should be an instance of HTMLElement', () => {
    expect(element).toBeInstanceOf(HTMLElement);
  });

  it('should have shadow root', () => {
    expect(element.shadowRoot).toBeDefined();
  });

  it('should render a piece element', () => {
    const piece = element.shadowRoot?.querySelector('.piece');
    expect(piece).toBeTruthy();
  });

  it('should have default piece as white pawn', () => {
    const bgElement = element.shadowRoot?.querySelector('.piece-bg');
    const fgElement = element.shadowRoot?.querySelector('.piece-fg');

    expect(bgElement?.textContent).toBe('__p');
    expect(fgElement?.textContent).toBe('w_p');
  });

  it('should accept piece attribute', () => {
    element.setAttribute('piece', 'q');
    element.setAttribute('color', 'b');

    const bgElement = element.shadowRoot?.querySelector('.piece-bg');
    const fgElement = element.shadowRoot?.querySelector('.piece-fg');

    expect(bgElement?.textContent).toBe('__q');
    expect(fgElement?.textContent).toBe('b_q');
  });

  it('should accept color attribute', () => {
    element.setAttribute('color', 'b');

    const fgElement = element.shadowRoot?.querySelector('.piece-fg');
    expect(fgElement?.textContent).toBe('b_p');
  });

  it('should handle all piece types', () => {
    const pieces: ChessPieceType[] = ['k', 'q', 'r', 'b', 'n', 'p', 'e', 't', 'a'];

    pieces.forEach(piece => {
      element.setAttribute('piece', piece);
      const bgElement = element.shadowRoot?.querySelector('.piece-bg');
      expect(bgElement?.textContent).toBe(`__${piece}`);
    });
  });

  it('should handle both colors', () => {
    const colors: ChessPieceColor[] = ['w', 'b', 'n'];

    colors.forEach(color => {
      element.setAttribute('color', color);
      const fgElement = element.shadowRoot?.querySelector('.piece-fg');
      expect(fgElement?.textContent).toBe(`${color}_p`);
    });
  });

  it('should update when attributes change', () => {
    // Initial state
    let fgElement = element.shadowRoot?.querySelector('.piece-fg');
    expect(fgElement?.textContent).toBe('w_p');

    // Change piece
    element.setAttribute('piece', 'k');
    fgElement = element.shadowRoot?.querySelector('.piece-fg');
    expect(fgElement?.textContent).toBe('w_k');

    // Change color
    element.setAttribute('color', 'b');
    fgElement = element.shadowRoot?.querySelector('.piece-fg');
    expect(fgElement?.textContent).toBe('b_k');
  });

  it('should have setPiece method', () => {
    expect(typeof element.setPiece).toBe('function');

    element.setPiece('r', 'b');

    const bgElement = element.shadowRoot?.querySelector('.piece-bg');
    const fgElement = element.shadowRoot?.querySelector('.piece-fg');

    expect(bgElement?.textContent).toBe('__r');
    expect(fgElement?.textContent).toBe('b_r');
  });

  it('should have getPiece method', () => {
    expect(typeof element.getPiece).toBe('function');

    element.setAttribute('piece', 'q');
    expect(element.getPiece()).toBe('q');
  });

  it('should have getColor method', () => {
    expect(typeof element.getColor).toBe('function');

    element.setAttribute('color', 'b');
    expect(element.getColor()).toBe('b');
  });

  it('should ignore invalid piece types', () => {
    element.setAttribute('piece', 'invalid');
    expect(element.getPiece()).toBe('p'); // Should remain default
  });

  it('should ignore invalid colors', () => {
    element.setAttribute('color', 'invalid');
    expect(element.getColor()).toBe('w'); // Should remain default
  });

  it('should be registered as custom element', () => {
    expect(customElements.get('chess-piece')).toBeDefined();
  });


  it.each([
    { piece: 'k' as ChessPieceType, color: 'w' as ChessPieceColor, expected: 'w_k' },
    { piece: 'q' as ChessPieceType, color: 'w' as ChessPieceColor, expected: 'w_q' },
    { piece: 'r' as ChessPieceType, color: 'w' as ChessPieceColor, expected: 'w_r' },
    { piece: 'b' as ChessPieceType, color: 'w' as ChessPieceColor, expected: 'w_b' },
    { piece: 'n' as ChessPieceType, color: 'w' as ChessPieceColor, expected: 'w_n' },
    { piece: 'p' as ChessPieceType, color: 'w' as ChessPieceColor, expected: 'w_p' },
    { piece: 'k' as ChessPieceType, color: 'b' as ChessPieceColor, expected: 'b_k' },
    { piece: 'q' as ChessPieceType, color: 'b' as ChessPieceColor, expected: 'b_q' },
    { piece: 'r' as ChessPieceType, color: 'b' as ChessPieceColor, expected: 'b_r' },
    { piece: 'b' as ChessPieceType, color: 'b' as ChessPieceColor, expected: 'b_b' },
    { piece: 'n' as ChessPieceType, color: 'b' as ChessPieceColor, expected: 'b_n' },
    { piece: 'p' as ChessPieceType, color: 'b' as ChessPieceColor, expected: 'b_p' },
  ])('should render piece %s with color %s correctly', ({ piece, color, expected }) => {
    element.setPiece(piece, color);
    const fgElement = element.shadowRoot?.querySelector('.piece-fg');
    expect(fgElement?.textContent).toBe(expected);
  });

  // Test rotation functionality
  describe('Rotation', () => {
    it('should have default rotation of 0 degrees', () => {
      expect(element.getRotation()).toBe('0');
    });

    it('should accept rotation attribute', () => {
      element.setAttribute('rotation', '90');
      expect(element.getRotation()).toBe('90');
      
      const pieceBgElement = element.shadowRoot?.querySelector('.piece .piece-bg') as HTMLElement;
      const pieceFgElement = element.shadowRoot?.querySelector('.piece .piece-fg') as HTMLElement;
      expect(pieceBgElement?.style.transform).toBe('rotate(90deg)');
      expect(pieceFgElement?.style.transform).toBe('rotate(90deg)');
    });

    it('should handle all valid rotation values', () => {
      const rotations: ChessPieceRotation[] = ['0', '45', '90', '135', '180', '225', '270', '315'];
      
      rotations.forEach(rotation => {
        element.setAttribute('rotation', rotation);
        expect(element.getRotation()).toBe(rotation);
        
        const pieceBgElement = element.shadowRoot?.querySelector('.piece .piece-bg') as HTMLElement;
        const pieceFgElement = element.shadowRoot?.querySelector('.piece .piece-fg') as HTMLElement;
        if (rotation === '0') {
          expect(pieceBgElement?.style.transform).toBe('');
          expect(pieceFgElement?.style.transform).toBe('');
        } else {
          expect(pieceBgElement?.style.transform).toBe(`rotate(${rotation}deg)`);
          expect(pieceFgElement?.style.transform).toBe(`rotate(${rotation}deg)`);
        }
      });
    });

    it('should have setRotation method', () => {
      expect(typeof element.setRotation).toBe('function');
      
      element.setRotation('180');
      expect(element.getRotation()).toBe('180');
      
      const pieceBgElement = element.shadowRoot?.querySelector('.piece .piece-bg') as HTMLElement;
      const pieceFgElement = element.shadowRoot?.querySelector('.piece .piece-fg') as HTMLElement;
      expect(pieceBgElement?.style.transform).toBe('rotate(180deg)');
      expect(pieceFgElement?.style.transform).toBe('rotate(180deg)');
    });

    it('should default to 0 for invalid rotation values', () => {
      element.setAttribute('rotation', 'invalid');
      expect(element.getRotation()).toBe('0');
    });
  });

  // Test fairy notation functionality
  describe('Fairy Notation', () => {
    it('should have empty fairy-name by default', () => {
      expect(element.getFairyName()).toBe('');
      
      const fairyNameElement = element.shadowRoot?.querySelector('.fairy-name') as HTMLElement;
      expect(fairyNameElement?.style.display).toBe('none');
    });

    it('should accept fairy-name attribute', () => {
      element.setAttribute('fairy-name', 'GRA');
      expect(element.getFairyName()).toBe('GRA');
      
      const fairyNameElement = element.shadowRoot?.querySelector('.fairy-name') as HTMLElement;
      expect(fairyNameElement?.textContent).toBe('GRA');
      expect(fairyNameElement?.style.display).toBe('block');
    });

    it('should truncate fairy-name to 3 characters', () => {
      element.setAttribute('fairy-name', 'TOOLONG');
      expect(element.getFairyName()).toBe('TOO');
      
      const fairyNameElement = element.shadowRoot?.querySelector('.fairy-name') as HTMLElement;
      expect(fairyNameElement?.textContent).toBe('TOO');
    });

    it('should have setFairyName method', () => {
      expect(typeof element.setFairyName).toBe('function');
      
      element.setFairyName('ABC');
      expect(element.getFairyName()).toBe('ABC');
    });

    it('should have empty fairy-condition by default', () => {
      expect(element.getFairyCondition()).toBe('');
      
      const fairyConditionElement = element.shadowRoot?.querySelector('.fairy-condition') as HTMLElement;
      expect(fairyConditionElement?.style.display).toBe('none');
    });

    it('should accept fairy-condition attribute', () => {
      element.setAttribute('fairy-condition', '=');
      expect(element.getFairyCondition()).toBe('=');
      
      const fairyConditionElement = element.shadowRoot?.querySelector('.fairy-condition') as HTMLElement;
      expect(fairyConditionElement?.textContent).toBe('=');
      expect(fairyConditionElement?.style.display).toBe('block');
    });

    it('should have setFairyCondition method', () => {
      expect(typeof element.setFairyCondition).toBe('function');
      
      element.setFairyCondition('&');
      expect(element.getFairyCondition()).toBe('&');
    });

    it('should display both fairy-name and fairy-condition simultaneously', () => {
      element.setAttribute('fairy-name', 'GRA');
      element.setAttribute('fairy-condition', '=');
      
      const fairyNameElement = element.shadowRoot?.querySelector('.fairy-name') as HTMLElement;
      const fairyConditionElement = element.shadowRoot?.querySelector('.fairy-condition') as HTMLElement;
      
      expect(fairyNameElement?.textContent).toBe('GRA');
      expect(fairyNameElement?.style.display).toBe('block');
      expect(fairyConditionElement?.textContent).toBe('=');
      expect(fairyConditionElement?.style.display).toBe('block');
    });
  });

  // Test combining rotation and fairy notation
  describe('Combined Features', () => {
    it('should support rotation with fairy notation', () => {
      element.setPiece('e', 'n'); // Neutral empress
      element.setRotation('90');
      element.setFairyName('GRA');
      element.setFairyCondition('=');
      
      expect(element.getPiece()).toBe('e');
      expect(element.getColor()).toBe('n');
      expect(element.getRotation()).toBe('90');
      expect(element.getFairyName()).toBe('GRA');
      expect(element.getFairyCondition()).toBe('=');
      
      const pieceBgElement = element.shadowRoot?.querySelector('.piece .piece-bg') as HTMLElement;
      const pieceFgElement = element.shadowRoot?.querySelector('.piece .piece-fg') as HTMLElement;
      expect(pieceBgElement?.style.transform).toBe('rotate(90deg)');
      expect(pieceFgElement?.style.transform).toBe('rotate(90deg)');

      const fairyNameElement = element.shadowRoot?.querySelector('.fairy-name') as HTMLElement;
      const fairyConditionElement = element.shadowRoot?.querySelector('.fairy-condition') as HTMLElement;
      
      expect(fairyNameElement?.style.display).toBe('block');
      expect(fairyConditionElement?.style.display).toBe('block');
    });

    it('should update rendering when multiple attributes change', () => {
      element.setPiece('t', 'w'); // White tiger
      element.setRotation('45');
      element.setFairyName('TIG');
      element.setFairyCondition('&');

      // Change multiple attributes
      element.setPiece('a', 'b'); // Black amazon
      element.setRotation('180');
      element.setFairyName('AMA');
      element.setFairyCondition('=');

      expect(element.getPiece()).toBe('a');
      expect(element.getColor()).toBe('b');
      expect(element.getRotation()).toBe('180');
      expect(element.getFairyName()).toBe('AMA');
      expect(element.getFairyCondition()).toBe('=');

      const pieceBgElement = element.shadowRoot?.querySelector('.piece .piece-bg') as HTMLElement;
      const pieceFgElement = element.shadowRoot?.querySelector('.piece .piece-fg') as HTMLElement;
      expect(pieceBgElement?.style.transform).toBe('rotate(180deg)');
      expect(pieceFgElement?.style.transform).toBe('rotate(180deg)');

      const fairyNameElement = element.shadowRoot?.querySelector('.fairy-name') as HTMLElement;
      const fairyConditionElement = element.shadowRoot?.querySelector('.fairy-condition') as HTMLElement;

      expect(fairyNameElement?.textContent).toBe('AMA');
      expect(fairyNameElement?.style.display).toBe('block');
      expect(fairyConditionElement?.textContent).toBe('=');
      expect(fairyConditionElement?.style.display).toBe('block');
    });
  });

  describe("custom event dispatching", () => {
    it("should dispatch 'metadata-change' event when fairy-name is set", () => {
      const spy = vi.fn();
      element.addEventListener('fairy-metadata-changed', spy);

      element.setFairyName('GRA');

      expect(spy).toHaveBeenCalledTimes(1);
      const event = spy.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toEqual({ fairyName: 'GRA' });
    });

    it("should dispatch 'metadata-change' event when fairy-condition is set", () => {
      const spy = vi.fn();
      element.addEventListener('fairy-metadata-changed', spy);

      element.setFairyCondition('=');

      expect(spy).toHaveBeenCalledTimes(1);
      const event = spy.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toEqual({ fairyCondition: '=' });
    });

    it("should dispatch 'metadata-change' event when both fairy-name and fairy-condition are set", () => {
      const spy = vi.fn();
      element.addEventListener('fairy-metadata-changed', spy);

      element.setFairyName('GRA');
      element.setFairyCondition('=');

      expect(spy).toHaveBeenCalledTimes(2);
      const event1 = spy.mock.calls[0][0] as CustomEvent;
      expect(event1.detail).toEqual({ fairyName: 'GRA' });

      const event2 = spy.mock.calls[1][0] as CustomEvent;
      expect(event2.detail).toEqual({ fairyCondition: '=', fairyName: 'GRA' });
    });

    it ("metadata-change event should include both fairyName and fairyCondition when both are set", () => {
      const spy = vi.fn();
      element.addEventListener('fairy-metadata-changed', spy);
      // set Attributes directly to simulate attribute changes without triggering the custom event
      element.setAttribute('fairy-name', 'GN');
      element.setAttribute('fairy-condition', '=');
      // now set the fairy name using the method to trigger the event
      element.setFairyName('GRA');

      const event2 = spy.mock.calls[0][0] as CustomEvent;
      expect(event2.detail).toEqual({ fairyCondition: '=', fairyName: 'GRA' });
    });
  });
});
