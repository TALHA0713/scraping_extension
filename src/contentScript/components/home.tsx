import React, { useState, useEffect } from 'react';
import Settings from './settings';

type HomeProps = {
  onClose: () => void;
  onScrape: () => void;
};

const Home: React.FC<HomeProps> = ({ onClose, onScrape }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'settings'>('home');
  const [isScrapingEnabled, setIsScrapingEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scrapingComplete, setScrapingComplete] = useState<boolean>(false);
  const [scrapedCount, setScrapedCount] = useState<number>(0);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [excelUrl, setExcelUrl] = useState<string>('');


  useEffect(() => {
    // Listen for messages from background script
    const messageListener = (message: any) => {
      console.log('Home component received message:', message);

      if (message.type === 'SCRAPE_COMPLETE') {
        console.log('Processing SCRAPE_COMPLETE:', message.data);
        setExcelUrl(message.data.excelUrl);
        setScrapedCount(message.data.count);
        setIsLoading(false);
        setScrapingComplete(true);
        setShowResults(true);

        // Hide completion message after 3 seconds
        setTimeout(() => {
          setScrapingComplete(false);
        }, 3000);
      } else if (message.type === 'SCRAPE_ERROR') {
        console.error('Scraping error:', message.error);
        setIsLoading(false);
        alert('Error during scraping: ' + message.error);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const handleToggleScraping = () => {
    setIsScrapingEnabled(!isScrapingEnabled);
    setScrapingComplete(false);
  };

  const handleStartScrape = async () => {
    setIsLoading(true);
    setScrapingComplete(false);
    setShowResults(false);
    setExcelUrl('');

    try {
      // Call the scrape function
      await onScrape();

      // Loading will be set to false when backend responds
    } catch (error) {
      console.error('Scraping failed:', error);
      setIsLoading(false);
    }
  };

  const handleDownloadExcel = () => {
    if (excelUrl) {
      // Open the Excel URL in a new tab to download
      window.open(excelUrl, '_blank');
    }
  };

  const handleClose = () => {
    // Prevent closing while scraping is in progress
    if (isLoading) {
      return;
    }

    setScrapingComplete(false);
    setShowResults(false);
    onClose();
  };


  const canScrape = isScrapingEnabled;

  // If settings tab is active, show settings component
  if (activeTab === 'settings') {
    return <Settings onBack={() => setActiveTab('home')} />;
  }

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={{
        position: 'relative',
        padding: '24px',
        width: '100%',
        maxWidth: '400px',
        minHeight: '300px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
      {/* Close button */}
      <button
        onClick={handleClose}
        disabled={isLoading}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'transparent',
          border: 'none',
          fontSize: '24px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          color: isLoading ? '#d1d5db' : '#666',
          padding: '4px 8px',
          lineHeight: '1',
          zIndex: 10,
          opacity: isLoading ? 0.5 : 1
        }}
        title={isLoading ? 'Please wait, scraping in progress...' : 'Close'}
      >
        
      </button>

      {/* Header with Settings Icon */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: '32px'
      }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h2 style={{
            margin: '0 0 8px 0',
            fontSize: '24px',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            Scraping Dashboard
          </h2>
          <p style={{
            margin: '0',
            fontSize: '14px',
            color: '#6b7280'
          }}>
            Manage your scraping preferences
          </p>
        </div>
        <button
          onClick={() => setActiveTab('settings')}
          style={{
            background: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e5e7eb';
            e.currentTarget.style.borderColor = '#9ca3af';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
            e.currentTarget.style.borderColor = '#d1d5db';
          }}
          title="Settings"
        >
          ⚙️
        </button>
      </div>


      {/* Scraping Status Card */}
      <div style={{
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <div>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '4px'
            }}>
              Scraping Status
            </div>
            <div style={{
              fontSize: '12px',
              color: '#6b7280'
            }}>
              {isScrapingEnabled ? 'Scraping enabled' : 'Scraping disabled'}
            </div>
          </div>
          <button
            onClick={handleToggleScraping}
            style={{
              position: 'relative',
              width: '48px',
              height: '24px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              background: isScrapingEnabled ? '#10b981' : '#d1d5db',
              transition: 'background 0.2s ease',
              padding: '0'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '2px',
              left: isScrapingEnabled ? '26px' : '2px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#fff',
              transition: 'left 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }} />
          </button>
        </div>
      </div>


      {/* Scraping Complete Message */}
      {scrapingComplete && (
        <div style={{
          background: '#d1fae5',
          border: '1px solid #6ee7b7',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '13px',
          color: '#065f46',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '16px' }}>✓</span>
          <span>Scraping completed! Found {scrapedCount} products</span>
        </div>
      )}

      {/* Results Section */}
      {showResults && scrapedCount > 0 && (
        <div style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '12px'
          }}>
            Scraping Results
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#FFB514',
            marginBottom: '8px'
          }}>
            {scrapedCount}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#6b7280',
            marginBottom: '12px'
          }}>
            Products scraped successfully
          </div>
          {excelUrl && (
            <button
              onClick={handleDownloadExcel}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#059669';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#10b981';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>📥</span>
              Download Excel
            </button>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginTop: 'auto'
      }}>
        <button
          onClick={handleStartScrape}
          disabled={!canScrape || isLoading}
          style={{
            padding: '12px 24px',
            background: canScrape && !isLoading ? '#FFB514' : '#d1d5db',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: canScrape && !isLoading ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            boxShadow: canScrape && !isLoading ? '0 2px 4px rgba(255,181,20,0.2)' : 'none',
            opacity: canScrape && !isLoading ? 1 : 0.6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            if (canScrape && !isLoading) {
              e.currentTarget.style.background = '#e5a312';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(255,181,20,0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (canScrape && !isLoading) {
              e.currentTarget.style.background = '#FFB514';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(255,181,20,0.2)';
            }
          }}
        >
          {isLoading && (
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid #fff',
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          )}
          {isLoading ? 'Scraping...' : 'Start Scraping'}
        </button>

        <button
          onClick={handleClose}
          disabled={isLoading}
          style={{
            padding: '12px 24px',
            background: 'transparent',
            color: isLoading ? '#d1d5db' : '#6b7280',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            opacity: isLoading ? 0.5 : 1
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.background = '#f9fafb';
              e.currentTarget.style.borderColor = '#d1d5db';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }
          }}
        >
          Close
        </button>
      </div>
    </div>
    </>
  );
};

export default Home;
