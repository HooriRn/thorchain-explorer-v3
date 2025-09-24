"use client";

import React, { useState, useEffect } from "react";
import styles from "./Footer.module.css";
import BlockIcon from "../assets/images/block.svg";
import GitlabIcon from "../assets/images/gitlab.svg";
import GithubIcon from "../assets/images/github-brands.svg";
import DiscordIcon from "../assets/images/discord-brands.svg";
import XIcon from "../assets/images/x.svg";
import { useChainsHeight } from "@/lib/store";

interface FooterProps {
  currentBlock?: number;
}

const Footer: React.FC<FooterProps> = ({ currentBlock }) => {
  const chainsHeight = useChainsHeight();

  const blockHeight =
    currentBlock ?? chainsHeight?.THOR ?? chainsHeight?.height ?? 0;

  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (blockHeight > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [blockHeight]);

  return (
    <div className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.footerText}>
          <span>THORChain Explorer 2025 ☀️ Made with ❤</span>
        </div>

        <div className={styles.footerText}>
          <div
            className={`${styles.blockHeight} ${
              isAnimating ? styles.animate : ""
            }`}
          >
            <small
              style={{ color: "var(--primary)" }}
              className={`mono ${styles.value}`}
            >
              <BlockIcon
                className={styles.blockIcon}
                width={12}
                height={12}
                fill="currentColor"
              />
              {blockHeight.toLocaleString()}
            </small>
          </div>
          <div className={styles.footerIcon}>
            <a
              href="https://gitlab.com/thorchain"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitlabIcon width={20} height={20} fill="currentColor" />
            </a>
            <a
              href="https://github.com/thorchain"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GithubIcon width={20} height={20} fill="currentColor" />
            </a>
            <a
              href="https://discord.gg/tW64BraTnX"
              target="_blank"
              rel="noopener noreferrer"
            >
              <DiscordIcon width={20} height={20} fill="currentColor" />
            </a>
            <a
              href="https://x.com/THORChain"
              target="_blank"
              rel="noopener noreferrer"
            >
              <XIcon width={20} height={20} fill="currentColor" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Footer;
