  export const checkModifiers = (event: KeyboardEvent): boolean => {
    return !event.altKey && !event.ctrlKey && !event.metaKey;
  };
