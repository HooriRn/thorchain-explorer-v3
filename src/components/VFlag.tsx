import React from 'react';
import styles from './VFlag.module.scss';

interface VFlagProps {
  flag: string;
}

const VFlag: React.FC<VFlagProps> = ({ flag }) => {
  const getImgPath = (): string | undefined => {
    if (!flag) {
      return undefined;
    }

    try {
      return require(`country-flag-icons/flags/3x2/${flag}.svg`);
    } catch (error) {
      console.warn(`Flag not found for country code: ${flag}`);
      return undefined;
    }
  };

  const imgPath = getImgPath();

  return (
    <div>
      {imgPath ? (
        <img
          src={imgPath}
          alt={`flag-${flag}`}
          className={`asset-icon ${styles.countryIcon}`}
        />
      ) : (
        <span>-</span>
      )}
    </div>
  );
};

export default VFlag;