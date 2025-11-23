import React, { useRef, MouseEvent } from 'react';
import IpIcon from '@/assets/images/ip.svg';
import styles from './Ip.module.scss';

interface IpProps {
  strCopy: string;
}

const Ip: React.FC<IpProps> = ({ strCopy }) => {
  const copyRef = useRef<HTMLDivElement>(null);

  const onlyCopy = async (textToCopy: string): Promise<void> => {
    if (!textToCopy) {
      return;
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      animateIcon();
    } catch (err) {
      console.error('Could not copy text: ', err);
    }
  };

  const animateIcon = (): void => {
    if (copyRef.current) {
      copyRef.current.classList.add(styles.animate);
      setTimeout(() => {
        if (copyRef.current) {
          copyRef.current.classList.remove(styles.animate);
        }
      }, 1000);
    }
  };

  const handleClick = (e: MouseEvent<HTMLDivElement>): void => {
    e.preventDefault();
    onlyCopy(strCopy);
  };

  const iconClasses = [
    styles.tableIcon,
    styles.copyIcon,
    !strCopy ? styles.disabled : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={copyRef}
      className={iconClasses}
      onClick={handleClick}
    >
      <IpIcon />
    </div>
  );
};

export default Ip;