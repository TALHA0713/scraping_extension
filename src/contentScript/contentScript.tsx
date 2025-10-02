import React, { useState, useEffect } from 'react';
import DraggableIcon from './components/dragableIcon';
import Home from './components/home';

const ContentScript = () => {
  const [value, setValue] = useState(1);
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

  const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setValue(newValue);
  };

  const handleOpen = (value: boolean) => {
    if (!isDragging) {
      setShowPopup(value);
    }
    setIsDragging(false); // Reset dragging state after open attempt
  };

  const handleDrag = (event: any, ui: any) => {
    setIsDragging(true); // Set dragging state to true during drag
    setPosition((prevPosition) => ({
      ...prevPosition,
      y: prevPosition.y + ui.deltaY,
    }));
  };

  const handleClose = () => {
    setShowPopup(false);
  };

  const handleScrape = () => {
    // Placeholder scrape trigger - you can wire to domain-specific utilities as needed
    console.log('Scrape started');
  };

  return (
    <>
      {!showPopup ? (
        <DraggableIcon position={position} handleOpen={handleOpen} handleDrag={handleDrag} />
      ) : (
        <div className="procure-popup-container">
          <Home onClose={handleClose} onScrape={handleScrape} />
        </div>
      )}
    </>
  );
};

export default ContentScript;
