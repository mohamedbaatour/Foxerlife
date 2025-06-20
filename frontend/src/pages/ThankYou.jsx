import React, { useEffect } from "react";

import "./ThankYou.css"; // Assuming you have a CSS file for styling
import LogoIcon from "../icones/foxidle3.png"; // Adjust the path as necessary

import { motion } from "framer-motion"; // Ensure framer-motion is installed

const ThankYou = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const reddit = [
    {
      name: "angelabuildsinpublic",
      link: "https://www.reddit.com/user/angelabuildsinpublic/",
    },
    {
      name: "juliluna_1969",
      link: "https://www.reddit.com/user/Enough-Muffin-5054/",
    },
    { name: "idesigntech07", link: "https://www.reddit.com/user/idesigntech07/" },
    {
      name: "believer-200",
      link: "https://www.reddit.com/user/believer-200/",
    },
    {
      name: "little_marzipan_2087",
      link: "https://www.reddit.com/user/Little_Marzipan_2087/",
    },
    {
      name: "gunasekaran R",
      link: "https://www.reddit.com/user/Own_Driver329/",
    },
  ];

  return (
    <motion.div
      className="thank-you-container"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
           <div style={{fontSize: '4rem'}}>🙏🏻</div>
      <div className="title-container">
        <p className="title">Thanks To Our Early Foxers </p>
      </div>
      <p className="subtitle">This journey wouldn't be the same without you.</p>
      <div className="thank-you-reddit">
        <div className="thank-you-reddit-title">
          <img
            className="thank-you-reddit-title-icon"
            src="https://redditinc.com/hs-fs/hubfs/Reddit%20Inc/Content/Brand%20Page/Reddit_Logo.png?width=600&height=600&name=Reddit_Logo.png"
            alt="Reddit Logo"
          />
          <p className="thank-you-reddit-title-text">Reddit</p>
        </div>
        <div className="thank-you-reddit-list">
          {reddit.map((user, idx) => (
            <a
              key={user.name + idx}
              href={user.link}
              target="_blank"
              rel="noopener noreferrer"
              className="thank-you-reddit-link"
            >
              u/ {user.name}
            </a>
          ))}
        </div>
      </div>
      <div className="thank-you-product-hunt">{/* ... */}</div>
    </motion.div>
  );
};

export default ThankYou;