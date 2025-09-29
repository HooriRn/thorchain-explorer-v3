"use client";

import React, { useState, useRef, useEffect } from "react";

interface DropdownModalProps {
  name: string;
  index: number;
  children: React.ReactNode;
}

const DropdownModal: React.FC<DropdownModalProps> = ({
  name,
  index,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="action-section" ref={dropdownRef}>
      <button
        className="action-btn"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {children}
      </button>

      {isOpen && (
        <div className="swap-interfaces">
          <div className="swap-menu">
            {React.Children.map(children, (child, childIndex) => {
              if (childIndex === 0) return null;
              return child;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DropdownModal;
