import { useEffect, useState } from "react";
import "./AdPopup.css";

export default function AdPopup() {
  const [visible, setVisible] = useState(false);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 1000); // show after 1s
    const closableTimer = setTimeout(() => setCanClose(true), 5000); // closable after 5s
    return () => {
      clearTimeout(showTimer);
      clearTimeout(closableTimer);
    };
  }, []);

  const closeAd = () => {
    if (canClose) setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="ad-popup" id="adPopup">
      {canClose && (
        <button className="close-btn" onClick={closeAd}>
          ×
        </button>
      )}
      <a href="https://your-adsterra-link.com" rel="nofollow" target="_blank">
        <img
          alt="Ad Banner"
          src="https://landings-cdn.adsterratech.com/referralBanners/png/300%20x%20250%20px.png"
          style={{ width: "100%", height: "auto", borderRadius: "8px" }}
        />
      </a>
    </div>
  );
}
