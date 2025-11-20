"use client";

import React, { useState, useEffect } from 'react';

interface VFlagProps {
  flag: string;
}

const VFlag: React.FC<VFlagProps> = ({ flag }) => {
  const [FlagComponent, setFlagComponent] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!flag) {
      return;
    }

    const loadFlag = async () => {
      try {
        const flagModule = await import(`country-flag-icons/react/3x2/${flag}`);
        setFlagComponent(() => flagModule.default);
      } catch {
        console.warn(`Flag not found for country code: ${flag}`);
        setError(true);
      }
    };

    loadFlag();
  }, [flag]);

  if (!flag) {
    return <span>-</span>;
  }

  if (error) {
    return <span>{flag}</span>;
  }

  if (!FlagComponent) {
    return <span>...</span>;
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center' }}>
      <FlagComponent 
        className="asset-icon country-icon" 
        style={{ width: '20px', height: '15px' }}
      />
    </div>
  );
};

export default VFlag;
