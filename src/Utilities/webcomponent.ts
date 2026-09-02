 
export function getBooleanAttribute(element: HTMLElement, attributeName: string): boolean {
  return element.hasAttribute(attributeName) && element.getAttribute(attributeName) !== 'false';
}
export function setBooleanAttribute(element: HTMLElement, attributeName: string, value: boolean): void {
  if (value) {
    element.setAttribute(attributeName, '');
  } else {
    element.removeAttribute(attributeName);
  }
}

export function getStringAttribute(element: HTMLElement, attributeName: string): string {
  return element.getAttribute(attributeName) ?? '';
}
export function setStringAttribute(element: HTMLElement, attributeName: string, value: string): void {
  element.setAttribute(attributeName, value);
}

export function getNumberAttribute(element: HTMLElement, attributeName: string): number {
  return Number(element.getAttribute(attributeName));
}
export function setNumberAttribute(element: HTMLElement, attributeName: string, value: number): void {
  element.setAttribute(attributeName, value.toString());
}

interface AttributeAccessor<TValue> {
  get: (element: HTMLElement, attributeName: string) => TValue;
  set: (element: HTMLElement, attributeName: string, value: TValue) => void;
}

type PropTypesForAccessors = "boolean" | "string" | "number";

interface AccessorsByType {
  boolean: AttributeAccessor<boolean>;
  string: AttributeAccessor<string>;
  number: AttributeAccessor<number>;
}

const attrMap: AccessorsByType = {
  boolean: {
    get: getBooleanAttribute,
    set: setBooleanAttribute,
  } satisfies AttributeAccessor<boolean>,
  string: {
    get: getStringAttribute,
    set: setStringAttribute,
  } satisfies AttributeAccessor<string>,
  number: {
    get: getNumberAttribute,
    set: setNumberAttribute,
  } satisfies AttributeAccessor<number>,
};


type ClassFieldDecorator<T, E> = (
  target: undefined,
  context: ClassFieldDecoratorContext<T, E>
) => void;

export function bindToAttribute<T>(attr: string, type: "boolean"): ClassFieldDecorator<T, boolean>;
export function bindToAttribute<T>(attr: string, type: "string"): ClassFieldDecorator<T, string>;
export function bindToAttribute<T>(attr: string, type: "number"): ClassFieldDecorator<T, number>;

export function bindToAttribute<T, V>(attributeName: string, type: PropTypesForAccessors) {
  const attrGetter = attrMap[type].get as AttributeAccessor<unknown>['get'];
  const attrSetter = attrMap[type].set as AttributeAccessor<unknown>['set'];
  return function(target: unknown, propertyAccessor: ClassFieldDecoratorContext<T, V>) {
    propertyAccessor.addInitializer(function () {
      Object.defineProperty(this, propertyAccessor.name, {
        get: function() {          
          return attrGetter(this, attributeName);
        },
        set: function(value: unknown) {
          attrSetter(this, attributeName, value);
        },
      });
    });
  };
}

/**
 * Applies the given HTML template and CSS style to the specified shadow root.
 * @param shadow The shadow root to which the template and style will be applied.
 * @param template The HTML template as a string.
 * @param style The CSS style as a string.
 */
export function applyTemplateAndCss(shadow: ShadowRoot, template: string, style: string): void {
  shadow.innerHTML = ''; // Clear any existing content
  // Create container from imported HTML template
  const templateContainer = document.createElement('template');
  templateContainer.innerHTML = template;

  // Add styles
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(style);
  shadow.adoptedStyleSheets = [sheet];

  shadow.appendChild(templateContainer.content.cloneNode(true));
}
