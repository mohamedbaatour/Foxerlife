import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DropDown = ({ options, value, onChange, width = 141, placeholder = "" }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const selected = options.find(opt => opt.value === value);

  return (
    <div
      className="custom-dropdown"
      ref={ref}
      style={{ width }}
      tabIndex={0}
      onBlur={() => setOpen(false)}
    >
      <div
        className={`custom-dropdown-selected${open ? " open" : ""}`}
        onClick={() => setOpen(o => !o)}
      >
        {selected ? selected.label : placeholder}
        <span className="custom-dropdown-arrow" />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            className="custom-dropdown-options"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {options.map(opt => (
              <div
                key={opt.value}
                className={`custom-dropdown-option${opt.value === value ? " selected" : ""}`}
                onClick={() => {
                  onChange({ target: { value: opt.value } });
                  setOpen(false);
                }}
              >
                {opt.label}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DropDown;