import { scrapObjectWithObserver } from './scrap';
import { extractCategory } from '../utils';
import {extractValuesFromDOMElements} from '../../utils/extractValuesFromElements'
export const extractBizChairUid = async (url: string): Promise<any> => {
  const selectors = {
    uid: ['.ra-product-main__inner div div p span','#ra-main-product div div div:nth-child(2) div:nth-child(2) div div div div div div:nth-child(2) span',],
    title: ['.ra-product-main div div div h1','#ra-main-product div div div:nth-child(2) div:nth-child(2) div div div div div h1'],
    img: ['.ra-gallery-carousel .ra-gallery-carousel__thumbnails swiper-slide[data-slide-index="1"] img'],
    price: ['#ra-main-product div div div:nth-child(2) div:nth-child(2) div div div div div:nth-child(2) div ','.ra-product-main__inner div:nth-child(2)'],
    category: ['.breadcrumbs'],
  };
  const domElements = await scrapObjectWithObserver(selectors, true);
  const object = extractValuesFromDOMElements(domElements);
  const scraped_data = {
    ...object,
    category: extractCategory(object.category) ?? null,
  };

  return scraped_data;
};
