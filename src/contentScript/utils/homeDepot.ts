import { extractUid } from './extractUid';
import { scrapObjectWithObserver } from './scrap';
import { extractCategory } from '../utils';
import {extractValuesFromDOMElements} from '../../utils/extractValuesFromElements'

export const extractHomeDepotUid = async (url: string): Promise<any> => {
  const regex = /\/(\d+)(?:[?#].*)?$/;
  const uid = extractUid(url, regex);
  const selector = {
    title: ['.product-details h1', '.product-details__badge-title--wrapper span h1'],
    img: ['.overlay__content div div div div div div','.mediagallery__mainimage  div button div img',
      '#root > div > div > div:nth-child(2) > div > div > div > div > div:nth-child(2) > div > div > div > div > img'
    ],
    price: [
      '#root > div > div > div:nth-child(2) > div > div > div > div:nth-child(3) > div > div > div > div > div > .sui-leading-none',
      '#root > div > div > div:nth-child(2) > div > div > div > div:nth-child(3) > div > div > div > div.sui-leading-none',
      "body div:nth-child(3) div div div div:nth-child(6) div div div div div div div",
      '#standard-price div',
      'body > div:nth-child(3) > div:nth-child(1) > div:nth-child(4) > div:nth-child(1) > div:nth-child(1) > div:nth-child(3) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1)',
      'body div:nth-child(3) div div div div:nth-child(6) div div div div div div div div div',
      '#root > div > div > div > div:nth-child(6) > div:nth-child(2) > div > div > div > div > div > div > div > div.sui-leading-none'
    ],

    product_information: ['.product-info-bar'],
    category: ['.breadcrumbs'],
  };
  const domElements = await scrapObjectWithObserver(selector, true);
  const object = extractValuesFromDOMElements(domElements);
  console.log("object--------------------",object);
  if (object.product_information) {
    const product_information = extractProductData(object.product_information);
    const scraped_data = {
      ...object,
      sku: getSku(product_information),
      upc: [product_information['Internet']].filter(Boolean),
      model: product_information['Model'] ?? null,
      category: extractCategory(object.category) ?? null,
    };
    console.log("object1------------",{...scraped_data, uid});
    return { ...scraped_data, uid };
  } else if (object.category) {
    const scraped_data = {
      ...object,
      category: extractCategory(object.category) ?? null,
    };
    console.log("object2------------",{ ...scraped_data, uid: uid });
    return { ...scraped_data, uid };
  }
  console.log("object3------------",{ ...object, uid });
  return { ...object, uid };
};

const extractProductData = (product_information) => {
  const initialParts = product_information
    .split(/(?=Internet #|Model #|Store SKU # |Store SO SKU #)/)
    .map((part) => part.trim());

  const product_details = initialParts.reduce((acc, part) => {
    const [key, value] = part.split(/#\s*/);
    if (key && value) {
      acc[key.trim()] = value.trim();
    }
    return acc;
  }, {});

  return product_details;
};

const getSku = (product_info) => {
  return product_info['Store SKU'] || product_info['Store SO SKU'] || null;
};
