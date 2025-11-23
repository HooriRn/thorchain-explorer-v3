"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { debounce } from "lodash";
import AssetIcon from "./AssetIcon";
import { Badge } from "./ui/badge";
import EnterIcon from "@/assets/images/arrow-turn-down-right.svg";
import styles from "./InputFilter.module.css";
import CrossIcon from "@/assets/images/cross.svg";

interface InputFilterProps {
  label?: string;
  tags?: string[];
  placeholder?: string;
  suggestions?: string[];
  allowTags?: boolean;
  format?: boolean;
  showEnterIcon?: boolean;
  onTagsUpdate?: (tags: string[]) => void;
}

const InputFilter: React.FC<InputFilterProps> = ({
  label = "",
  tags = [],
  placeholder = "",
  suggestions = [],
  allowTags = true,
  format = true,
  showEnterIcon = true,
  onTagsUpdate,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const tagsWrapClass = tags.length > 2 ? styles.wrap : styles.noWrap;
  const enterIconClass = isFocused
    ? styles.enterIconVisible
    : styles.enterIconHidden;

  const filteredOptions = useMemo(() => {
    const query = inputValue.toLowerCase();
    if (query.length < 2) {
      return [];
    }
    return suggestions.filter((option) => option.toLowerCase().includes(query));
  }, [inputValue, suggestions]);

  const debouncedOnInput = useRef(
    debounce(() => {
      setShowSuggestions(true);
    }, 300)
  );

  useEffect(() => {
    return () => {
      debouncedOnInput.current.cancel();
    };
  }, []);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    debouncedOnInput.current();
  }, []);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (inputValue.trim().length > 2) {
      setShowSuggestions(true);
    }
  }, [inputValue]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setShowSuggestions(false);
  }, []);

  const addTag = useCallback(() => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !tags.includes(trimmedValue)) {
      if (onTagsUpdate) {
        onTagsUpdate([...tags, trimmedValue]);
      }
      setInputValue("");
      setShowSuggestions(false);
    }
  }, [inputValue, tags, onTagsUpdate]);

  const handleKeyUp = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        addTag();
      }
    },
    [addTag]
  );

  const removeTag = useCallback(
    (index: number) => {
      if (onTagsUpdate) {
        onTagsUpdate(tags.filter((_, i) => i !== index));
      }
    },
    [tags, onTagsUpdate]
  );

  const selectOption = useCallback(
    (asset: string) => {
      if (!tags.includes(asset)) {
        if (onTagsUpdate) {
          onTagsUpdate([...tags, asset]);
        }
        setInputValue("");
        setShowSuggestions(false);
      }
    },
    [tags, onTagsUpdate]
  );

  const formatAddress = (string: string) => {
    if (string && string.length > 12) {
      return string.slice(0, 6) + "..." + string.slice(-6);
    } else {
      return string;
    }
  };

  const formatAsset = (asset: string) => {
    return asset.length > 10 ? asset.slice(0, 14) + "..." : asset;
  };

  return (
    <div className={styles.formGroup}>
      {label && <label>{label}</label>}

      <div className={`${styles.tagsInput} ${tagsWrapClass}`}>
        {tags.map((tag, index) => (
          <Badge
            key={`${tag}-${index}`}
            variant="green"
            className={styles.tagBadge}
            style={{
              padding: "2px 5px",
              gap: "6px",
              fontSize: "0.75rem",
            }}
          >
            {format ? formatAddress(tag) : tag}
            <span className={styles.removeTag} onClick={() => removeTag(index)}>
              <CrossIcon width={10} height={10} />
            </span>
          </Badge>
        ))}
        <div id="input-container" className={styles.inputContainer}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInput}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyUp={handleKeyUp}
            placeholder={placeholder}
          />
          {showEnterIcon && (
            <div
              className={`${styles.enterIconContainer} ${
                isFocused
                  ? styles.enterIconContainerVisible
                  : styles.enterIconContainerHidden
              }`}
            >
              <EnterIcon
                className={` ${enterIconClass} ${styles.enterIcon}`}
                onClick={addTag}
              />
            </div>
          )}
        </div>
      </div>
      {showSuggestions && filteredOptions.length > 0 && (
        <ul className={styles.suggestions}>
          {filteredOptions.map((option, index) => (
            <li
              key={`${option}-${index}`}
              onMouseDown={(e) => {
                e.preventDefault();
                selectOption(option);
              }}
            >
              {format && (
                <AssetIcon asset={option} classes={[styles.assetIcon]} />
              )}
              {format ? formatAsset(option) : option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default InputFilter;
