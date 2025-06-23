import React from "react";
import "./Blocked.css"; // Assuming you have a CSS file for styling

const Blocked = () => {
  return (
    <div className="blocked-container">
      <p className="blocked-title">Israel is blocked</p>
      <p className="blocked-subtitle">This service does not support regions complicit in genocide or apartheid.</p>
    </div>
  );
}

export default Blocked;