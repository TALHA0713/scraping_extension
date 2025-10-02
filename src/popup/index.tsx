import React from 'react';
import { createRoot } from 'react-dom/client';
import Home from '../contentScript/components/home';
import '../style/index.css';
import './popup.css';

function init() {
  const appContainer = document.createElement('div');
  appContainer.id = 'popup-root';
  document.body.appendChild(appContainer);
  if (!appContainer) {
    throw new Error('Can not find AppContainer');
  }
  const root = createRoot(appContainer);
  const handleScrape = () => console.log('Scrape from popup');
  const handleClose = () => window.close();
  root.render(<Home onScrape={handleScrape} onClose={handleClose} />);
}

init();
