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

  if (msg.type === 'SCRAPE_REQUESTED') {
    console.log('Scrape requested:', msg.data);

    // Send to backend server
    const backendUrl = 'http://localhost:4000/scrape';

    fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        urls: msg.data.urls,
        width: 300,
        height: 300
      })
    })
      .then(response => response.json())
      .then(data => {
        console.log('Backend response:', data);

        // Send CSV path back to content script
        if (data.success && data.csv) {
          const csvUrl = `http://localhost:4000${data.csv}`;
          chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]?.id) {
              chrome.tabs.sendMessage(tabs[0].id, {
                type: 'SCRAPE_COMPLETE',
                data: {
                  csvUrl: csvUrl,
                  count: data.count
                }
              });
            }
          });
        }
      })
      .catch(error => {
        console.error('Error sending to backend:', error);
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: 'SCRAPE_ERROR',
              error: error.message
            });
          }
        });
      });

    return true;
  }
});