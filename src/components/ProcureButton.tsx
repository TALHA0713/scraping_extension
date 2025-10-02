import React from 'react';

type ProcureButtonProps = {
  onClick: () => void;
  text: string;
};
const ProcureButton = (props: ProcureButtonProps) => {
  const { onClick, text } = props;
  return (
    <button
      style={{ backgroundColor: '#FFB514', color: 'white', border: '1px solid white', width:"200px", padding: '6px 12px', borderRadius: 4 }}
      onClick={onClick}
    >
      {text}
    </button>
  );
};

export default ProcureButton;
