import * as React from 'react';
interface Props {
  fullscreen?: boolean;
}

const Loader = (props: Props) => {
  const { fullscreen } = props;
  const wrapperClass = `loader-wrapper ${!!fullscreen ? 'fixed' : 'block'}`;
  return (
    <>
      <div className={wrapperClass}>
        <div className="bounce-loader">
          <div className="loader">
            <div className="circle-container">
              <div className="circle position-one blue-bg" />
            </div>
            <div className="circle-container">
              <div className="circle position-two orange-bg" />
            </div>
            <div className="circle-container">
              <div className="circle position-three orange-bg" />
            </div>
            <div className="circle-container">
              <div className="circle position-four blue-bg" />
            </div>
          </div>
        </div>
      </div>
    </>

  );
}
export default Loader;
