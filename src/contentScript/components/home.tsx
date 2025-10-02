import React, { useState } from 'react';

type HomeProps = {
  onClose?: () => void;
  onScrape?: () => void;
};

const Home: React.FC<HomeProps> = (props) => {
  const { onClose, onScrape } = props;
  const [wantsScrape, setWantsScrape] = useState<boolean | null>(null);

  return (
    <div className="home-root p-4">
      <button aria-label="Close" onClick={onClose} className="home-close">×</button>

      <div className="home-title">Home</div>
      {wantsScrape === null && (
        <div className="home-text">
          Do you want scraping?
          <div className="home-actions">
            <button onClick={() => setWantsScrape(true)} style={{ padding: '6px 12px', background: '#FFB514', color: '#fff', border: 'none' }}>Yes</button>
            <button onClick={onClose} style={{ padding: '6px 12px', background: '#e5e7eb', border: 'none' }}>No</button>
          </div>
        </div>
      )}

      {wantsScrape === true && (
        <div style={{ marginTop: '16px' }}>
          <button onClick={onScrape} style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none' }}>
            Scrap
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;
