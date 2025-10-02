import { extractCategory } from '../utils';
import { extractUid } from './extractUid';
import { getElementWithoutObserver, scrapObjectWithObserver } from './scrap';
import {extractValuesFromDOMElements} from '../../utils/extractValuesFromElements'

export const extractWalmartUid = async (url: string) => {
  const regex = /\/(\d+)(?:\?|$)/i;
  const uid = extractUid(url, regex);

  const selectors = {
    title: ['#main-title'],
    img: [
      '#maincontent > section > main > div > div:nth-child(2) > div > div > div > div > section > div > div > div > div > div > div > div > div > img',
      '#maincontent > section > main > div > div:nth-child(2) > div > div > div > div > section > div > div > div > div > div > img',
      '#maincontent > section > main > div > div:nth-child(2) > div > div > div > div > section > div > div > div > button > div > img',
    ],
    price: [
      '#maincontent > section > main > div > div:nth-child(2) > div > div > div > div:nth-child(2) > div > div > span > span > span',
      '#maincontent > section > main > div > div:nth-child(2) > div > div:nth-child(3) > div > div  > div > div > span > span > span',
    ],
    category: [
      '#maincontent > section > main > div > div:nth-child(4) > div > div > nav > ol',
      '#maincontent > section > main > div.flex.flex-column.h-100 > div:nth-child(4) > div > div > nav > ol',
    ],
    brand: [
      '#maincontent > section > main > div > div:nth-child(2) > div > div > div > div:nth-child(2) > div > div > section:nth-child(2) > div > div > a',
    ],
    headerTitle: ['head title'],
  };

  const text = await getElementWithoutObserver(
    '#intent-banner-section button div div div:nth-child(2) div:nth-child(2) div',
  );
  const zipCode = text?.match(/\d{5}/)[0];
  if (zipCode) {
    chrome.storage.local.set({ zipCode: zipCode });
  }

  const domElements = await scrapObjectWithObserver(selectors, true);
  const object = extractValuesFromDOMElements(domElements);
 
  const scraped_data = {
    ...object,
    title: object.title ?? object.headerTitle,
    brand: object.brand ? extractProductBrand(object.brand) : null,
    category: extractCategory(object.category) ?? null,
  };

  return { ...scraped_data, uid };
};

const extractProductBrand = (brand) => {
  return brand.includes('Visit the ') ? brand.replace('Visit the ', '').replace('Store', '').trim() : brand;
};
