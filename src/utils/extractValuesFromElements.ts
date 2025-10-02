export const extractValuesFromDOMElements = (object: Record<string, HTMLElement | null>): Record<string, string | null> => {
    const extractedValues: Record<string, string | null> = {};
    for (const [key, value] of Object.entries(object)) {
      if (value) {
        extractedValues[key] = value instanceof HTMLImageElement ? value.src : value.textContent?.trim() || null;
      } else {
        extractedValues[key] = null;
      }
    }
    return extractedValues;
  };

