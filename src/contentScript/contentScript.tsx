import React, { useState, useEffect } from 'react';
import DraggableIcon from './components/dragableIcon';
import Home from './components/home';

const ContentScript = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const storedPosition = localStorage.getItem('avatarPosition');
    if (storedPosition) {
      setPosition(JSON.parse(storedPosition));
    }
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

  const handleScrape = () => {
    console.log('Scrape started');
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
