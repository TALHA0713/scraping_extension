import React from 'react';
import * as ReactDOM from 'react-dom/client';
import ContentScript from './contentScript';
import { extractRootDomain } from './utils';
import { hideExtensionOnCaptcha } from '../utils/hideExtensionOnCaptcha';
async function init() {
  try {
    const response = await fetch(chrome.runtime.getURL('index.css'));
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const textContent = await response.text();

    const existingElement = document.getElementById('procure-shadow-root');

    if (existingElement) {
      existingElement.remove();
    }

    const container = document.createElement('div');
    container.id = 'procure-shadow-root';
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

    

    const hideExtensionVerification = [
      {
        domain: 'unbeatablesale',
        className: '.zone-name-title',
      },
      {
        domain: 'bestbuy',
        className: '.country-selection',
      }

    ];
    const captchaExists = hideExtensionVerification.some((hideExtension) => hideExtension.domain === extractRootDomain(document.URL))
      ? hideExtensionOnCaptcha(hideExtensionVerification)
      : null;

    ReactDOM.createRoot(shadowRootElement).render(
      <React.StrictMode>{captchaExists ? null : <ContentScript />}</React.StrictMode>,
    );
  } catch (error) {
    console.log('Failed to fetch and apply CSS:', error);
  }
}
init();
