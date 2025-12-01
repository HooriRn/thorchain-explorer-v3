"use client";

import React from 'react';
import * as Flags from 'country-flag-icons/react/3x2';

interface VFlagProps {
  flag: string;
  className?: string;
  style?: React.CSSProperties;
}

const VFlag: React.FC<VFlagProps> = ({ flag, className = "", style = {} }) => {
  if (!flag) {
    return <span>-</span>;
  }

  const countryCode = flag.toUpperCase();
  
  const FlagComponent = Flags[countryCode as keyof typeof Flags];
  
  if (!FlagComponent) {
    return <span title={` ${countryCode}`}>{countryCode}</span>;
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center' }} title={countryCode}>
      <FlagComponent 
        className={`asset-icon country-icon ${className}`} 
        style={{ 
          width: '20px', 
          height: '15px',
          borderRadius: '2px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          ...style 
        }}
      />
    </div>
  );
};

export default VFlag;