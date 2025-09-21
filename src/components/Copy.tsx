import React, { useState, useRef } from "react";
import CopyIcon from "@/assets/images/clone.svg";
import Checkmark from "@/assets/images/square-checkmark.svg";
import styles from "@/components/Copy.module.css";

interface CopyIconComponentProps {
  strCopy: string;
  size?: "small" | "normal";
  hideToast?: boolean;
}

const CopyIconComponent = ({
  strCopy,
  size,
  hideToast,
}: CopyIconComponentProps) => {
  const [showToast, setShowToast] = useState(false);
  const copyRef = useRef<SVGSVGElement>(null);

  const animate = (duration: number) => {
    if (copyRef.current) {
      copyRef.current.classList.add(styles["animate"]);
      setTimeout(() => {
        if (copyRef.current) {
          copyRef.current.classList.remove(styles["animate"]);
        }
      }, duration);
    }
  };

  const onlyCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        animate(1000);
        if (!hideToast) {
          showToastNotification();
        }
      },
      (err) => {}
    );
  };

  const showToastNotification = () => {
    setShowToast(true);
    setTimeout(() => {
      closeToast();
    }, 3000);
  };

  const closeToast = () => {
    setShowToast(false);
  };

  const iconSize =
    size === "small"
      ? { width: "0.92rem", height: "0.92rem" }
      : { width: "1rem", height: "1rem" };

  return (
    <div className={styles["copy-icon-container"]}>
      <CopyIcon
        ref={copyRef}
        className={`table-icon ${styles["copy-icon"]}`}
        style={iconSize}
        onClick={() => onlyCopy(strCopy)}
      />

      {showToast && (
        <div className={`${styles["toast"]} ${styles["toast-enter-active"]}`}>
          <div className="toast-header">
            <div className="checkmark">
              <Checkmark className={styles["Checkmark"]} />
            </div>
          </div>
          <div className={`${styles["toast-body"]} mono`}>
            copied to clipboard! <br />
            <span className={styles["copy-text"]}>{strCopy}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CopyIconComponent;
