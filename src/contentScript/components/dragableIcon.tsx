import React, { useRef, useState } from 'react';
import { MdOutlineOpenInFull } from 'react-icons/md';
import Draggable from 'react-draggable';

interface DragableIconProps {
  position: { x: number; y: number };
  handleOpen: (value: boolean) => void;
  handleDrag: (event: any, ui: any) => void;
}

const DragableIcon = (props: DragableIconProps) => {
  const { position, handleDrag, handleOpen } = props;
  const draggableRef = useRef<HTMLDivElement>(null);
  const defaultIcon = chrome.runtime.getURL('icon.png');
  const [iconSrc, setIconSrc] = useState<string>(defaultIcon);

  return (
    <div>
      <Draggable
        axis="y"
        position={position}
        onDrag={handleDrag}
        bounds={{ top: 50, bottom: 650 }}
        nodeRef={draggableRef}
      >
        <div className="dragable" ref={draggableRef}>
          <button id="icon_envelope" onClick={() => handleOpen(true)}>
            <img src={iconSrc} onError={() => setIconSrc(defaultIcon)} className="avatar" height={'100%'} alt="Icon" />
            <div className="hover-icon">
              <MdOutlineOpenInFull />
            </div>
          </button>
        </div>
      </Draggable>
    </div>
  );
};

export default DragableIcon;
