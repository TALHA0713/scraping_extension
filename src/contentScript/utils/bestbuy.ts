import { extractUid } from './extractUid';
import { scrapObjectWithObserver } from './scrap';
import { extractCategory } from '../utils';
import {extractValuesFromDOMElements} from '../../utils/extractValuesFromElements'

export const extractBestbuyUid = async (url: string) => {
  const regex = /\/(\d+)\.p/i;
  // const regex = /\/(\d{5,})\b/;
  const uid = extractUid(url, regex);
  const selector = {
    title: ['.sku-title h1'],
    img: ['.media-gallery-base-content div div div div div button img', '.media-gallery-base-content div   button img'],
    price: ['.priceView-customer-price span'],
    category: ['.c-breadcrumbs ol'],
  };
   const domElements = await scrapObjectWithObserver(selector, true);
  const object = extractValuesFromDOMElements(domElements);

  const scraped_data = {
    ...object,
    category: extractCategory(object.category) ?? null,
  };

  return { ...scraped_data, uid };
};
