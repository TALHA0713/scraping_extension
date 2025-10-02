type Selectors = {
  title?: string[];
  price?: string[];
  img?: string[];
  uid?: string[];
  category?: string[];
  product_information?: string[];
  brand?: string[];
  headerTitle?: string[];
  prod_details?: string[];
};

export const getElementWithoutObserver = async (selector: string | undefined): Promise<string | null> => {
  if (!selector) return null;
  const element = document.querySelector(selector) as HTMLElement | null;
  if (element) {
    return element instanceof HTMLImageElement ? element.src : element.textContent?.trim() || null;
  }
  return null;
};

const getElementWithObserver = async (
  selectors: string[] | undefined,
  mutationObs: Boolean,
): Promise<HTMLElement | null> => {
  if (!selectors || selectors.length === 0) return null;

  const checkElement = (selector: string): HTMLElement | null => document.querySelector(selector) as HTMLElement | null;

  const waitForElement = async (selector: string): Promise<HTMLElement | null> => {
    return new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        const element = checkElement(selector);
        if (mutationObs && element) {
          observer.disconnect();
          resolve(element);
        } else {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });

      const initialElement = checkElement(selector);
      if (initialElement) {
        observer.disconnect();
        resolve(initialElement);
      }
    });
  };

  for (const sel of selectors) {
    const element = await waitForElement(sel);
    if (element) return element;
  }

  return null;
};

const extractDataWithObserver = async (
  selectors: string[] | undefined,
  mutationObs: Boolean,
): Promise<HTMLElement | null> => {
  const element = await getElementWithObserver(selectors, mutationObs);
  if (element) {
    return element;
  }
  return null;
};

const pollForElement = async (
  selectors: string[],
  timeout: number,
  mutationObs?: Boolean,
  withObserver?: Boolean
): Promise<any> => {
  if (!selectors || selectors.length === 0) return null;
  const endTime = Date.now() + timeout;
  while (Date.now() < endTime) {
    const getElement = async (): Promise<HTMLElement | null> =>
      withObserver
        ? await getElementWithObserver(selectors, mutationObs)
        : document.querySelector(selectors[0]) as HTMLElement | null;
    const element = await getElement();
    if (element) {
      return element;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  return null;
};

export const scrapObjectWithObserver = async (
  selectors: Selectors,
  mutationObs?: Boolean,
): Promise<Record<keyof Selectors, HTMLElement | null>> => {
  const results: Record<keyof Selectors, HTMLElement | null> = {
    title: await pollForElement(selectors.title, 5000),
    price: await extractDataWithObserver(selectors.price, mutationObs),
    img: await pollForElement(selectors.img, 3000, mutationObs, true),
    uid: await extractDataWithObserver(selectors.uid, mutationObs),
    category: await extractDataWithObserver(selectors.category, mutationObs),
    product_information: await extractDataWithObserver(selectors.product_information, mutationObs),
    brand: await extractDataWithObserver(selectors.brand, mutationObs),
    headerTitle: await extractDataWithObserver(selectors.headerTitle, mutationObs),
    prod_details: await extractDataWithObserver(selectors.prod_details, mutationObs),
  };

  return results;
};
