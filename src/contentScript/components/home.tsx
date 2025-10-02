import React, { useState, useEffect } from 'react';

type HomeProps = {
  onClose: () => void;
  onScrape: () => void;
};

const Home: React.FC<HomeProps> = ({ onClose, onScrape }) => {
  const [email, setEmail] = useState<string>('');
  const [isScrapingEnabled, setIsScrapingEnabled] = useState<boolean>(false);

  useEffect(() => {
    chrome.storage.local.get(['emailId'], (result) => {
      if (result.emailId) {
        setEmail(result.emailId);
      }
    });
  }, []);

  const handleToggleScraping = () => {
    setIsScrapingEnabled(!isScrapingEnabled);
  };

  const handleStartScrape = () => {
    onScrape();
  };

  return (
    <div style={{
      position: 'relative',
      padding: '24px',
      width: '100%',
      minHeight: '300px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'transparent',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer',
          color: '#666',
          padding: '4px 8px',
          lineHeight: '1'
        }}
      >
        ×
      </button>

      {/* Header */}
      <div style={{ textAlign: 'center' }}>
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

      {/* User Info Card */}
      <div style={{
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px'
      }}>
        <div style={{
          fontSize: '12px',
          fontWeight: '600',
          color: '#6b7280',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          User Account
        </div>
        <div style={{
          fontSize: '16px',
          color: '#1f2937',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#FFB514',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            {email ? email.charAt(0).toUpperCase() : 'U'}
          </span>
          {email || 'Not logged in'}
        </div>
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
              {isScrapingEnabled ? 'Active and ready' : 'Currently disabled'}
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

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginTop: 'auto'
      }}>
        <button
          onClick={handleStartScrape}
          disabled={!isScrapingEnabled}
          style={{
            padding: '12px 24px',
            background: isScrapingEnabled ? '#FFB514' : '#d1d5db',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: isScrapingEnabled ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            boxShadow: isScrapingEnabled ? '0 2px 4px rgba(255,181,20,0.2)' : 'none',
            opacity: isScrapingEnabled ? 1 : 0.6
          }}
          onMouseEnter={(e) => {
            if (isScrapingEnabled) {
              e.currentTarget.style.background = '#e5a312';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(255,181,20,0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (isScrapingEnabled) {
              e.currentTarget.style.background = '#FFB514';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(255,181,20,0.2)';
            }
          }}
        >
          Start Scraping
        </button>

        <button
          onClick={onClose}
          style={{
            padding: '12px 24px',
            background: 'transparent',
            color: '#6b7280',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f9fafb';
            e.currentTarget.style.borderColor = '#d1d5db';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = '#e5e7eb';
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default Home;
