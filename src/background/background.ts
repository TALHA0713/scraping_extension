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
        message: 'Procure extension is open (mock mode).',
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
});
const urlPatterns = {
  whitelist: ['*://www.walmart.com/ip/*'],
  blacklist: ['*://www.walmart.com/search*', "*://www.walmart.com/",
    '*://www.walmart.com/shop/*', '*://www.walmart.com/cp/*', '*://www.walmart.com/browse/*']
};

function injectScript(tabId: number) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['contentScript.js'],
  });
}
function isUrlMatched(url: string, patterns: any) {
  return patterns.some(pattern => {
    const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/(^\w+:|^)\/\//, '($1)://') + '$');
    return regexPattern.test(url);
  });
}
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    handleUrlChange(tabId, changeInfo.url);
  }
});

function handleUrlChange(tabId, url) {
  if (isUrlMatched(url, urlPatterns.whitelist)) {
    injectScript(tabId);
  } else if (isUrlMatched(url, urlPatterns.blacklist)) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    removeContentScript(tabId)
  })
}}

function removeContentScript(tabId){
  chrome.tabs.sendMessage(tabId, { action: "removeContentScript" }, (response) => {
    if (chrome.runtime.lastError) {
      console.warn("Error sending message:", chrome.runtime.lastError.message);
    } else {
      console.log("Response from content script:", response);
    }
  });
}