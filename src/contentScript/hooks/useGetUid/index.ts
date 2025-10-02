import { useEffect, useState } from 'react';
import { extractRootDomain } from '../../utils';
import { extractAmazonUid } from '../../utils/amazon';
import { extractWalmartUid } from '../../utils/walmart';
import { extractBestbuyUid } from '../../utils/bestbuy';
import { extractUnbeatablesaleUid } from '../../utils/unbeatablesale';
import { extractHomeDepotUid } from '../../utils/homeDepot';
import { extractBizChairUid } from '../../utils/bizChair';
import { MerchantObject, MerchantType } from '../../types';

const useGetUid = () => {
  const [merchantObject, setMerchantObject] = useState<MerchantObject | null>(null);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState(null);
  const [similarProducts, setSimilarProducts] = useState(null);
  const [url, setUrl] = useState(document.URL);
  const [zipCode, setZipCode] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const handleUrlChange = () => {
      setUrl(document.URL);
    };
    chrome.storage.local.get(['zipCode','emailId'], function (result) {
      if (result.zipCode) {
        setZipCode(result.zipCode);
      }
      if (result.emailId) {
        setEmail(result.emailId);
      }
    });

    const observer = new MutationObserver(handleUrlChange);
    observer.observe(document.documentElement, { subtree: true, childList: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const rootDomain = extractRootDomain(url);
    switch (rootDomain) {
      case 'amazon':
        const setAmazonUid = async () => {
          const amazonData = await extractAmazonUid(url);
          setMerchantObject({ sku: amazonData.uid, merchant: MerchantType.amazon, ...amazonData });
        };
        setAmazonUid();
        break;
      case 'walmart':
        const setWalmartUid = async () => {
          const walmartData = await extractWalmartUid(url);
          setMerchantObject({ sku: walmartData.uid, merchant: MerchantType.walmart, ...walmartData });
        };
        setWalmartUid();
        break;

      case 'bestbuy':
        const setBestBuyUid = async () => {
          const bestbuyData = await extractBestbuyUid(url);
          setMerchantObject({ sku: bestbuyData.uid, merchant: MerchantType.bestbuy, ...bestbuyData });
        };

        setBestBuyUid();
        break;

      case 'unbeatablesale':
        const setUnbeatablesaleUid = async () => {
          const unbeatablesaleUid = await extractUnbeatablesaleUid(url);
          setMerchantObject({
            sku: unbeatablesaleUid.uid,
            merchant: MerchantType.unbeatablesale,
            ...unbeatablesaleUid,
          });
        };
        setUnbeatablesaleUid();
        break;
      case 'homedepot':
        const setHomeDepotUid = async () => {
          const homeDepotUid = await extractHomeDepotUid(url);
          setMerchantObject({
            ...homeDepotUid, 
            sku: homeDepotUid.sku || homeDepotUid.uid,
            merchant: MerchantType.homeDepot,
            upc:homeDepotUid.upc
          });
        };
        setHomeDepotUid();
        break;

      case 'bizchair':
        const setBizChairUid = async () => {
          const bizChairUid = await extractBizChairUid(url);
          setMerchantObject({ sku: bizChairUid.uid, merchant: MerchantType.bizchair, ...bizChairUid });
        };
        setBizChairUid();
        break;
      default:
        console.log('Unknown Domain');
    }
  }, [url]);

  useEffect(() => {
    const sendMessageToBackground = async () => {
      if (merchantObject) {
        setLoading(true);
        chrome.runtime.sendMessage({ action: 'fetchData', merchant: merchantObject, zipCode: zipCode, email:email }, (response) => {
          if (response.status === 'success') {
            setProducts(response.exactProducts);
            setSimilarProducts(response.similarProducts);
            console.log('Exact alternatives received:', response.exactProducts);
            console.log('Similar alternatives received:', response.similarProducts);
          } else {
            console.log('Error received:', response.message);
          }
          setLoading(false);
        });
      }
    };
    sendMessageToBackground();
  }, [merchantObject]);

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "removeContentScript") {
      const existingElement = document.getElementById('procure-shadow-root');
      if (existingElement) {
        existingElement.remove();
      }
      sendResponse({ status: "Received", message: "Content script action processed" });
    }
  });

  return {
    loading,
    product: {
      offers: products,
      recommendations: similarProducts,
      title: merchantObject?.title || '',
      description: '',
      price: merchantObject?.price || '',
      discountPrice: '',
      imageUrl: merchantObject?.img || '',
      category: merchantObject?.category || '',
      brand: merchantObject?.brand || '',
      upc: merchantObject?.upc || '',
      gtin: merchantObject?.gtin || '',
      model: merchantObject?.model || '',
      internet: merchantObject?.internet || '',
      merchant:merchantObject?.merchant || '',
    },
  };
};

export type UseLocationsReturnType = ReturnType<typeof useGetUid>;
export default useGetUid;
