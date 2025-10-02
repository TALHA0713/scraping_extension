import React from 'react';
import * as ReactDOM from 'react-dom/client';
import ContentScript from './contentScript';

function checkIfSupportedPage() {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  const search = window.location.search;

  // Check for Amazon search page
  if (hostname.includes('amazon.com') && pathname.includes('/s')) {
    return true;
  }

  // Check for ANY Noon page (not just search pages)
  if (hostname.includes('noon.com')) {
    return true;
  }

  // Check for IKEA search page
  if (hostname.includes('ikea.com') && pathname.includes('/search')) {
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
    document.body.insertBefore(container, document.body.firstChild);

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
  } catch (error) {
    console.log('Failed to fetch and apply CSS:', error);
  }
}

// Monitor URL changes to reinitialize extension on supported pages
function monitorUrlChanges() {
  setInterval(() => {
    if (window.location.href !== currentUrl) {
      const newUrl = window.location.href;
      const oldUrl = currentUrl;
      currentUrl = newUrl;
      
      console.log('URL changed from:', oldUrl, 'to:', newUrl);
      
      // Check if new URL is supported
      if (checkIfSupportedPage()) {
        if (!isExtensionLoaded) {
          console.log('Navigated to supported page, waiting for DOM and initializing extension');
          // Wait for DOM to be ready before initializing
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
              setTimeout(init, 1500); // Wait for page to fully load
            });
          } else {
            setTimeout(init, 1500); // Wait for page to fully load
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
  }, 1000); // Increased interval to 1 second
}

// Wait for DOM to be ready before initializing
function waitForDOM() {
  function initializeWhenReady() {
    // Check if page is fully loaded
    if (document.readyState === 'complete') {
      console.log('Page fully loaded, initializing extension');
      setTimeout(init, 2000); // Wait 2 seconds for page to stabilize
    } else {
      console.log('Page still loading, waiting...');
      setTimeout(initializeWhenReady, 500); // Check again in 500ms
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

// Initialize when DOM is ready
waitForDOM();

// Start monitoring URL changes
monitorUrlChanges();
