"use client";

import React from 'react';
import Link from 'next/link';

interface NavItem {
  mode: string;
  text: string;
  link?: string;
  hide?: boolean;
}

interface NavProps {
  activeMode?: string;
  navItems: NavItem[];
  isLink?: boolean;
  extraClasses?: string[];
  preText?: string;
  hide?: boolean;
  onActiveModeChange?: (mode: string) => void;
}

const Nav: React.FC<NavProps> = ({
  activeMode,
  navItems,
  isLink = false,
  extraClasses = [],
  preText,
  hide,
  onActiveModeChange
}) => {
  const filteredNav = navItems.filter((n) => n.hide !== true);

  const handleClick = (mode: string) => {
    if (!isLink && onActiveModeChange) {
      onActiveModeChange(mode);
    }
  };

  return (
    <div className={`nav-headers box ${extraClasses.join(' ')}`}>
      {preText && (
        <span className="pre-text">
          {preText}
        </span>
      )}
      {filteredNav.map((navItem) => {
        const isActive = activeMode && activeMode === navItem.mode;
        
        if (isLink && navItem.link) {
          return (
            <Link
              key={navItem.mode}
              href={navItem.link}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              {navItem.text}
            </Link>
          );
        }

        return (
          <div
            key={navItem.mode}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => handleClick(navItem.mode)}
          >
            {navItem.text}
          </div>
        );
      })}
    </div>
  );
};

export default Nav; 