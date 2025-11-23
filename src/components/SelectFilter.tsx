"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Badge } from "./ui/badge";
import styles from "./SelectFilter.module.css";

interface SelectFilterProps {
  label?: string;
  options?: string[];
  default?: string[];
  onSelectedOptionsUpdate?: (selectedOptions: string[]) => void;
}

const SelectFilter: React.FC<SelectFilterProps> = ({
  label,
  options = [],
  default: defaultOptions = [],
  onSelectedOptionsUpdate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    defaultOptions || []
  );
  const [dropdownStyles, setDropdownStyles] = useState({
    position: "fixed" as const,
    top: "0px",
    left: "0px",
    width: "auto",
  });
  const dropdownButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedOptions(defaultOptions || []);
  }, [defaultOptions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        dropdownButtonRef.current &&
        !dropdownButtonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) {
        setPosition();
      }
      return !prev;
    });
  }, []);

  const setPosition = useCallback(() => {
    if (dropdownButtonRef.current) {
      const buttonRect = dropdownButtonRef.current.getBoundingClientRect();
      setDropdownStyles({
        position: "fixed",
        top: `${buttonRect.bottom}px`,
        left: `${buttonRect.left}px`,
        width: `${buttonRect.width}px`,
      });
    }
  }, []);

  const addOption = useCallback(
    (option: string) => {
      setSelectedOptions((prev) => {
        const newSelected = [...prev, option];
        if (onSelectedOptionsUpdate) {
          onSelectedOptionsUpdate(newSelected);
        }
        return newSelected;
      });
    },
    [onSelectedOptionsUpdate]
  );

  const removeOption = useCallback(
    (option: string) => {
      setSelectedOptions((prev) => {
        const newSelected = prev.filter((opt) => opt !== option);
        if (onSelectedOptionsUpdate) {
          onSelectedOptionsUpdate(newSelected);
        }
        return newSelected;
      });
    },
    [onSelectedOptionsUpdate]
  );

  const toggleOption = useCallback(
    (option: string) => {
      setSelectedOptions((prev) => {
        if (prev.includes(option)) {
          const newSelected = prev.filter((opt) => opt !== option);
          if (onSelectedOptionsUpdate) {
            onSelectedOptionsUpdate(newSelected);
          }
          return newSelected;
        } else {
          const newSelected = [...prev, option];
          if (onSelectedOptionsUpdate) {
            onSelectedOptionsUpdate(newSelected);
          }
          return newSelected;
        }
      });
    },
    [onSelectedOptionsUpdate]
  );

  const clearSelections = useCallback(() => {
    setSelectedOptions([]);
    if (onSelectedOptionsUpdate) {
      onSelectedOptionsUpdate([]);
    }
  }, [onSelectedOptionsUpdate]);

  const AngleIcon = () => (
    <svg
      className={styles.dropdownIcon}
      width="1rem"
      height="1rem"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );

  const CheckIcon = () => (
    <svg
      className={styles.checkmark}
      width="0.8rem"
      height="0.8rem"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );

  const CrossIcon = ({ onClick }: { onClick?: () => void }) => (
    <svg
      className={styles.removeTag}
      onClick={onClick}
      width="0.5rem"
      height="0.5rem"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );

  return (
    <div className={styles.formGroup}>
      {label && <label>{label}</label>}
      <div ref={dropdownButtonRef} className={styles.customDropdown}>
        <div className={styles.dropdownButton} onClick={toggleDropdown}>
          <div className={styles.selectedOptions}>
            {selectedOptions.length <= 3 ? (
              <>
                {selectedOptions.map((option, index) => (
                  <Badge
                    key={index}
                    variant="green"
                    className={styles.tagBadge}
                    style={{
                      padding: "2px 5px",
                      gap: "6px",
                      fontSize: "0.75rem",
                    }}
                  >
                    {option}
                    <span onClick={(e) => e.stopPropagation()}>
                      <CrossIcon onClick={() => removeOption(option)} />
                    </span>
                  </Badge>
                ))}
              </>
            ) : (
              <Badge
                variant="green"
                className={`${styles.tagBadge} ${styles.multipleSelected}`}
                style={{
                  padding: "2px 5px",
                  gap: "6px",
                  fontSize: "0.75rem",
                }}
              >
                {selectedOptions.length} selected
                <span onClick={(e) => e.stopPropagation()}>
                  <CrossIcon onClick={clearSelections} />
                </span>
              </Badge>
            )}
            {selectedOptions.length === 0 && <span>All</span>}
          </div>
          <AngleIcon />
        </div>
      </div>
      {isOpen && (
        <div className={styles.dropdownOptions} style={dropdownStyles}>
          {options.map((option, index) => (
            <div
              key={index}
              className={`${styles.dropdownOption} ${
                selectedOptions.includes(option) ? styles.selected : ""
              }`}
              onClick={() => toggleOption(option)}
            >
              {selectedOptions.includes(option) && <CheckIcon />}
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SelectFilter;
