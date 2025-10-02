import React, { useState, useEffect } from 'react';
import DraggableIcon from './components/dragableIcon';
import Home from './components/home';
import { productScraper } from './utils/productScraper';

const ContentScript = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isScraping, setIsScraping] = useState(false);

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
    if (isScraping) {
      console.log('Scraping already in progress...');
      return;
    }

    setIsScraping(true);
    console.log('Scrape started');
    
    try {
      const products = productScraper.getAllProducts();

      // Store count globally for UI access
      (window as any).productScraperCount = products.length;

      console.log('%c========================================', 'color: #FFB514; font-weight: bold');
      console.log('%c SCRAPING RESULTS', 'color: #FFB514; font-size: 18px; font-weight: bold');
      console.log('%c========================================', 'color: #FFB514; font-weight: bold');
      console.log(`%c Total Products Found: ${products.length}`, 'color: #10b981; font-size: 14px; font-weight: bold');
      console.log('%c\n📋 Product URLs:', 'color: #3b82f6; font-size: 14px; font-weight: bold');

      products.forEach((product, index) => {
        console.log(`%c${index + 1}. ${product.url}`, 'color: #6b7280');
      });

      console.log('%c========================================\n', 'color: #FFB514; font-weight: bold');

      // Generate CSV file
      if (products.length > 0) {
        const csvContent = generateCSV(products);
        downloadCSV(csvContent, `products-${Date.now()}.csv`);
        
        // Stop the scraper after CSV download
        productScraper.stopScraping();
        console.log('Scraping stopped after CSV download');
      }

      // Send to background script with better error handling
      try {
        await chrome.runtime.sendMessage({
          type: 'SCRAPE_REQUESTED',
          data: {
            products: products,
            timestamp: Date.now()
          }
        });
      } catch (error) {
        // Check if extension context is invalidated
        if (error instanceof Error && error.message.includes('Extension context invalidated')) {
          console.log('Extension was reloaded. Please refresh the page.');
        } else {
          console.log('Failed to send scrape request:', error);
        }
      }
    } finally {
      setIsScraping(false);
    }
  };

  const generateCSV = (products: any[]) => {
    // CSV Header
    let csv = 'No,Product URL,Title,Source,Scraped At\n';

    // CSV Rows
    products.forEach((product, index) => {
      const url = product.url || '';
      const title = (product.title || '').replace(/"/g, '""'); // Escape quotes
      const source = product.source || '';
      const timestamp = new Date().toISOString();

      csv += `${index + 1},"${url}","${title}","${source}","${timestamp}"\n`;
    });

    return csv;
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`%c✓ CSV file downloaded: ${filename}`, 'color: #10b981; font-weight: bold');
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
