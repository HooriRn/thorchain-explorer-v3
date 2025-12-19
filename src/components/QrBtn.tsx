import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import styles from './QRWrapper.module.css';

interface QRWrapperProps {
  qrcode: string;
}

const QRWrapper: React.FC<QRWrapperProps> = ({ qrcode }) => {
  const [showQR, setShowQR] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const size = 200;

  const onlyCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        showToastNotification();
      },
      (err) => {
        console.error('Could not copy text: ', err);
      }
    );
  };

  const showToastNotification = () => {
    setIsToastVisible(true);
    setTimeout(() => {
      setIsToastVisible(false);
    }, 2000);
  };

  const handleWrapperClick = () => {
    setIsModalVisible(true);
  };

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleCloseClick = () => {
    setIsModalVisible(false);
  };

  const handleOverlayClick = () => {
    onlyCopy(qrcode);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalVisible) {
        setIsModalVisible(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isModalVisible]);

  return (
    <div className={styles.qrWrapper} onClick={handleWrapperClick}>
      <svg className={styles.icon} width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h6v6h-6z"/>
      </svg>
      
      {/* Modal */}
      {isModalVisible && (
        <div 
          className={`${styles.modalBackground} ${styles.fadeEnterActive}`}
          onClick={() => setIsModalVisible(false)}
        >
          <div 
            className={styles.qrShow}
            onClick={handleModalClick}
          >
            <div className={styles.qrBody}>
              <span>QR Code!</span>
              <div className={styles.closeBtn} onClick={handleCloseClick}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </div>
            </div>
            
            <div className={styles.line} />
            
            <div className={styles.qrCodeContainer}>
              <QRCodeSVG
                value={qrcode}
                size={size}
                level="Q"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#000000"
                className={styles.qrCode}
              />
              <div 
                className={styles.clickOverlay}
                onClick={handleOverlayClick}
              />
            </div>
            
            <div className={`${styles.qrText} ${styles.mono}`}>
              {qrcode}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <div 
        className={styles.toastNotification}
        style={{ 
          opacity: isToastVisible ? 0.9 : 0,
          visibility: isToastVisible ? 'visible' : 'hidden',
        }}
      >
        copied to clipboard!
      </div>
    </div>
  );
};

export default QRWrapper;