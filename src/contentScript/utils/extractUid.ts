export const extractUid = (url: string, regex: RegExp) => {
    const match = url.match(regex);
    
    if (match) {
      return match[1];
    }
    
    return null;
  }