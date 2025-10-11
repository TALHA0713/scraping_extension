import React, { useState, useEffect } from 'react';
import DraggableIcon from './components/dragableIcon';
import Home from './components/home';
import { productScraper } from './utils/productScraper';

const ContentScript = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const storedPosition = localStorage.getItem('avatarPosition');
    if (storedPosition) {
      setPosition(JSON.parse(storedPosition));
    }

    // Initialize product scraper
    productScraper.initialize();

    // Cleanup on unmount
    return () => {
      productScraper.destroy();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('avatarPosition', JSON.stringify(position));
  }, [position]);

  const handleOpen = () => {
    if (!isDragging) {
      setShowPopup(true);
    }
    setIsDragging(false);
  };

  const handleDrag = (event: any, ui: any) => {
    setIsDragging(true);
    setPosition((prevPosition) => ({
      ...prevPosition,
      y: prevPosition.y + ui.deltaY,
    }));
  };

  const handleClose = () => {
    setShowPopup(false);
  };

  const handleScrape = async () => {
    console.log('Scrape started');

    try {
      // Start the scraping process
      productScraper.startScraping();

      // Wait for products to be extracted (wait for pagination/scroll)
      console.log('Waiting for page to load products...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      const products = productScraper.getAllProducts();
      const productUrls = products.map(p => p.url);

      // Stop the mutation observer
      productScraper.stopScraping();

      // Store count globally for UI access
      (window as any).productScraperCount = productUrls.length;

      console.log('%c========================================', 'color: #FFB514; font-weight: bold');
      console.log('%c SCRAPING RESULTS', 'color: #FFB514; font-size: 18px; font-weight: bold');
      console.log('%c========================================', 'color: #FFB514; font-weight: bold');
      console.log(`%c Total Products Found: ${productUrls.length}`, 'color: #10b981; font-size: 14px; font-weight: bold');
      console.log('%c\n📋 Product URLs Array:', 'color: #3b82f6; font-size: 14px; font-weight: bold');
      console.log(productUrls);
      console.log('%c========================================\n', 'color: #FFB514; font-weight: bold');

      // Get system information
      const systemInfo = await getSystemInfo();
      console.log('%c System Information:', 'color: #8b5cf6; font-size: 14px; font-weight: bold');
      console.log(systemInfo);
      console.log('%c========================================\n', 'color: #FFB514; font-weight: bold');

      // Send to background script with better error handling
      try {
        await chrome.runtime.sendMessage({
          type: 'SCRAPE_REQUESTED',
          data: {
            urls: productUrls,
            systemInfo: systemInfo,
            timestamp: Date.now()
          }
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes('Extension context invalidated')) {
          console.log('Extension was reloaded. Please refresh the page.');
        } else {
          console.log('Failed to send scrape request:', error);
        }
      }
    } catch (error) {
      console.error('Error during scraping:', error);
    } finally {
      console.log('Scraping completed');
    }
  };

  const getSystemInfo = async () => {
    const info: any = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString()
    };

    // Try to get IP address
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      info.ipAddress = ipData.ip;
    } catch (error) {
      info.ipAddress = 'Unable to fetch';
    }

    return info;
  };

  return (
    <>
      {!showPopup && (
        <DraggableIcon position={position} handleOpen={handleOpen} handleDrag={handleDrag} />
      )}
      {showPopup && (
        <div className="extension-popup-container">
          <Home onClose={handleClose} onScrape={handleScrape} />
        </div>
      )}
    </>
  );
};

export default ContentScript;
