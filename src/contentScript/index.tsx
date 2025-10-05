import React from 'react';
import * as ReactDOM from 'react-dom/client';
import ContentScript from './contentScript';

function checkIfSupportedPage() {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;

  if (hostname.includes('amazon.com') && pathname.includes('/s')) {
    return true;
  }

  if (hostname.includes('noon.com')) {
    return true;
  }

  if (hostname.includes('ikea.') && pathname.includes('/search')) {
    return true;
  }

  return false;
}

let isExtensionLoaded = false;
let currentUrl = window.location.href;

async function init() {
  console.log('Content script loaded on:', window.location.href);

  if (!checkIfSupportedPage()) {
    console.log('Not on a supported page, extension will not load');
    return; // Don't initialize extension on non-supported domains
  }

  console.log('Extension initializing on:', window.location.href);

  try {
    if (!document.body) {
      console.log('Document body not ready, waiting...');
      setTimeout(init, 500);
      return;
    }

    const response = await fetch(chrome.runtime.getURL('index.css'));
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const textContent = await response.text();

    const existingElement = document.getElementById('extension-shadow-root');
    if (existingElement) {
      existingElement.remove();
    }

    const container = document.createElement('div');
    container.id = 'extension-shadow-root';

    if (document.body.firstChild && document.body.contains(document.body.firstChild)) {
      document.body.insertBefore(container, document.body.firstChild);
    } else {
      document.body.appendChild(container);
    }

    const shadowContainer = container.attachShadow({ mode: 'open' });
    const shadowRootElement = document.createElement('div');
    shadowRootElement.className = 'browser_extension';

    const style = document.createElement('style');
    const emotionRoot = document.createElement('style');
    style.textContent = textContent;
    shadowContainer.appendChild(style);
    shadowContainer.appendChild(emotionRoot);
    shadowContainer.appendChild(shadowRootElement);

    ReactDOM.createRoot(shadowRootElement).render(
      <React.StrictMode>
        <ContentScript />
      </React.StrictMode>,
    );

    isExtensionLoaded = true;
    console.log('Extension loaded successfully');
  } catch (error) {
    console.error('Failed to initialize extension:', error);
    isExtensionLoaded = false;
  }
}

function monitorUrlChanges() {
  setInterval(() => {
    if (window.location.href !== currentUrl) {
      const newUrl = window.location.href;
      const oldUrl = currentUrl;
      currentUrl = newUrl;

      console.log('URL changed from:', oldUrl, 'to:', newUrl);

      if (checkIfSupportedPage()) {
        if (!isExtensionLoaded) {
          console.log('Navigated to supported page, waiting for DOM and initializing extension');
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
              setTimeout(init, 1500);
            });
          } else {
            setTimeout(init, 1500);
          }
        }
      } else {
        if (isExtensionLoaded) {
          console.log('Navigated away from supported page, removing extension');
          const existingElement = document.getElementById('extension-shadow-root');
          if (existingElement) {
            existingElement.remove();
          }
          isExtensionLoaded = false;
        }
      }
    }
  }, 1000);
}

function waitForDOM() {
  function initializeWhenReady() {
    if (document.readyState === 'complete') {
      console.log('Page fully loaded, initializing extension');
      setTimeout(init, 2000);
    } else {
      console.log('Page still loading, waiting...');
      setTimeout(initializeWhenReady, 500);
    }
  }

  if (document.readyState === 'loading') {
    console.log('DOM still loading, waiting for DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', () => {
      console.log('DOM content loaded, checking if page is complete');
      initializeWhenReady();
    });
  } else {
    console.log('DOM already loaded, checking if page is complete');
    initializeWhenReady();
  }
}

waitForDOM();
monitorUrlChanges();
