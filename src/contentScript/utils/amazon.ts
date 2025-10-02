import { extractCategory } from '../utils';
import { extractUid } from './extractUid';
import { getElementWithoutObserver, scrapObjectWithObserver } from './scrap';
import {extractValuesFromDOMElements} from '../../utils/extractValuesFromElements'

export const extractAmazonUid = async (url: string) => {
  const regex = /\/dp\/([A-Z0-9]{10})(?:\/|\?|$)/i;
  const uid = extractUid(url, regex) || '';

  const selectors = {
    title: ['#title span', '#titleSection h1 span', '#productTitle'],
    img: ['#imgTagWrapperId img','.imgTagWrapper img'],
    price: [
      '.priceToPay span[aria-hidden="true"]',
      '#priceblock_ourprice span',
      '#formats div div span span span:nth-child(3).slot-price',
      '.apexPriceToPay span:nth-child(2)',
    ],
    product_information: ['#prodDetails tbody'],
    category: ['#wayfinding-breadcrumbs_feature_div .a-unordered-list'],
    brand: ['#productOverview_feature_div tbody'],
    prod_details: ['#detailBulletsWrapper_feature_div ul'],
  };

  const text = await getElementWithoutObserver('#glow-ingress-line2');
  const zipCode = text?.match(/\d{5}/);
  if (zipCode) {
    chrome.storage.local.set({ zipCode: zipCode });
  }
  const domElements = await scrapObjectWithObserver(selectors);
  const object = extractValuesFromDOMElements(domElements);

  if (object.product_information) {
    const product_information = extractProductData(object.product_information);
    const scraped_data = createScrapedData(object, product_information);
    return { ...scraped_data, uid };
  } else if (object.brand) {
    const scraped_data = {
      ...object,
      brand: extractProductData(object.brand)['Brand'] ?? null,
      category: extractCategory(object.category) ?? null,
      upc: extractField(object.prod_details, 'UPC'),
      model: extractField(object.prod_details, 'Item model number'),
    };
    return { ...scraped_data, uid };
  } else if (object.category) {
    const scraped_data = {
      ...object,
      category: extractCategory(object.category) ?? null,
      upc: extractField(object.prod_details, 'UPC'),
      model: extractField(object.prod_details, 'Item model number'),
    };
    return { ...scraped_data, uid };
  } else if (object.prod_details) {
    const scraped_data = {
      ...object,
      upc: extractField(object.prod_details, 'UPC'),
      model: extractField(object.prod_details, 'Item model number'),
    };
    return { ...scraped_data, uid };
  }
  return { ...object, uid };
};

const extractProductData = (tableData) => {
  // Define the keywords to split by
  const keywords = ['Brand Name', 'Brand', 'UPC', 'Item model number', 'Global Trade Identification Number'];

  const pattern = keywords.map((keyword) => `(${keyword})\\s*([\\s\\S]*?)(?=\\s{2,}|$)`)?.join('|');

  const regex = new RegExp(pattern, 'g');
  let match;
  const results = {};

  while ((match = regex.exec(tableData)) !== null) {
    for (let i = 1; i < match.length; i += 2) {
      if (match[i]) {
        results[match[i]] = match[i + 1].trim();
      }
    }
  }

  return results;
};

const getBrand = (product_info, object) => {
  return product_info['Brand Name'] || product_info['Brand'] || extractProductData(object.brand)['Brand'] || null;
};

const getUPC = (upc) => {
  if (!upc) return []; 
  return upc?.split(' ');
};

const extractField = (data, keyword) => {
  const normalizedData = data?.replace(/[\s\u200B\u00A0]+/g, ' ');

  const regex = /(UPC|Manufac|Item model number|Date|Country|Product|ASIN|Depart)/;
  if (data) {
    const rows = normalizedData
      ?.split(regex)
      ?.filter(Boolean)
      ?.map((item) => item.trim());
    const keywordId = rows?.findIndex((part) => part.trim()?.startsWith(keyword));
    const value =
      keywordId !== -1 && rows[keywordId + 1] 
      ?rows[keywordId + 1]
      ?.replace(/[:\u200E\u200F]/g, '')
      ?.replace(/\s+/g, ' ')
      .trim() : null;
      
    if (keyword === 'UPC') return getUPC(value)

      return value;
  }
};

const createScrapedData = (object, product_info) => {
  return {
    ...object,
    category: extractCategory(object.category) ?? null,
    brand: getBrand(product_info, object),
    upc: getUPC(product_info['UPC']),
    gtin: product_info['Global Trade Identification Number'] ?? null,
    model: product_info['Item model number'] ?? null,
  };
};
