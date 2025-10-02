import { scrapObjectWithObserver } from './scrap';
import { extractCategory } from '../utils';
import {extractValuesFromDOMElements} from '../../utils/extractValuesFromElements'

export const extractUnbeatablesaleUid = async (url: string) => {
  const selector = {
    title: ['#product-details-form div:nth-child(2) div div h1'],
    img: ['#picture img'],
    price: ['.product-price span'],
    uid: ['.sku .value'],
    category: ['.breadcrumb'],
    product_information: ['.table-wrapper tbody'],
  };
  const domElements = await scrapObjectWithObserver(selector, true);
  const object = extractValuesFromDOMElements(domElements);

  if (object.product_information) {
    const scraped_data = {
      ...object,
      upc: extractProductData(object.product_information),
      category: extractCategory(object.category) ?? null,
    };

    return { ...scraped_data, uid: object.uid?.toLowerCase() };
  } else if (object.category) {
    const scraped_data = {
      ...object,
      category: extractCategory(object.category) ?? null,
    };
    return { ...scraped_data, uid: object.uid?.toLowerCase() };
  }

  return { ...object, uid: object.uid?.toLowerCase() };
};

export const extractProductData = (tableData: string): string[] => {
  const rows = tableData
    .split(/\s+/)
    .flatMap((part) => part.split(/\n+/))
    .filter(Boolean);

  const mpnIndex = rows.findIndex((part) => part.trim().startsWith('MPN'));
  return mpnIndex !== -1 && rows[mpnIndex + 1] ? [rows[mpnIndex + 1].trim()] : [];
};
