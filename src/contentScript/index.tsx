import React from 'react';
import * as ReactDOM from 'react-dom/client';
import ContentScript from './contentScript';

async function init() {
  // Check if we're on a supported domain
  const isAmazon = window.location.hostname.includes('amazon.com');
  const isNoon = window.location.hostname.includes('noon.com');

  if (!isAmazon && !isNoon) {
    return; // Don't initialize extension on non-supported domains
  }

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
  } catch (error) {
    console.log('Failed to fetch and apply CSS:', error);
  }
}
init();
