import React from "react";

import "./ThankYou.css"; // Assuming you have a CSS file for styling
import LogoIcon from "../icones/foxidle3.png"; // Adjust the path as necessary

const ThankYou = () => {
  return (
    <div className="thank-you-container">
      <div className="title-container">
        <img className="thank-you-logo-icon" src={LogoIcon} alt="foxi"/>
      <p className="title">Foxy Thanks To Our Early Explorers!</p>
      </div>
      <p className="subtitle">
      This journey wouldn't be the same without you.
      </p>
    </div>
  );
}

export default ThankYou;