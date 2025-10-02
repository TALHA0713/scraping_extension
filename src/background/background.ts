let lastMerchant = null;
let lastCallTime = 0;
let pendingResponses: Array<(response: any) => void> = [];
const messageHandler = {
  async fetchData(msg: any, sendResponse: any) {
    const currentTime = Date.now();

    try {
      const { merchant } = msg;
      const sku = merchant?.sku || null;
      const uid = merchant?.upc || null;

      if (this.shouldThrottleRequest(sku, uid, currentTime)) {
        pendingResponses.push(sendResponse);
        return;
      }

      lastMerchant = merchant;
      lastCallTime = currentTime;

      const mockResponse = {
        status: 'success',
        exactProducts: [],
        similarProducts: [],
        message: 'Browser extension is active (mock mode).',
      };

      sendResponse(mockResponse);
      this.notifyPendingResponses(mockResponse);
    } catch (error: any) {
      const errorMessage = error.message || 'An unknown error occurred';
      sendResponse({ status: 'error', message: errorMessage });
      this.notifyPendingResponses({ status: 'error', message: errorMessage });
    }
  },

  shouldThrottleRequest(sku: string, uid: string, currentTime: number) {
    const lastSku = lastMerchant?.sku || null;
    const lastUid = lastMerchant?.upc || null;
    return sku === lastSku && uid === lastUid && currentTime - lastCallTime < 500;
  },

  notifyPendingResponses(response: any) {
    while (pendingResponses.length > 0) {
      const pendingResponse = pendingResponses.shift();
      if (pendingResponse) {
        pendingResponse(response);
      }
    }
  },
};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'fetchData') {
    messageHandler.fetchData(msg, sendResponse);
    return true;
  }

  // Handle product scraping messages
  if (msg.type === 'PRODUCTS_EXTRACTED') {
    console.log('Products extracted from content script:', msg.data);
    // Store the products or send them to a server
    // For now, just log them
    return true;
  }

  if (msg.type === 'SCRAPE_REQUESTED') {
    console.log('Scrape requested from content script:', msg.data);
    // Handle manual scrape request
    return true;
  }
});