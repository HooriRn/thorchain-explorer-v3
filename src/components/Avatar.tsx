"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createAvatar } from "@dicebear/core";
import { identicon } from "@dicebear/collection";
import styles from "./Avatar.module.css";

interface AvatarProps {
  name: string;
  small?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({ name, small = false }) => {
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  const generateAvatar = useCallback(async () => {
    try {
      const { toPng } = await import("@dicebear/converter");

      const avatar = createAvatar(identicon, { seed: name }).toString();
      const png = await toPng(avatar);
      const dataUri = await png.toDataUri();

      setAvatarUrl(dataUri);
    } catch (error) {
      console.error("Error generating avatar:", error);
      const avatar = createAvatar(identicon, { seed: name }).toString();
      const svgDataUri = `data:image/svg+xml;base64,${btoa(avatar)}`;
      setAvatarUrl(svgDataUri);
    }
  }, [name]);

  useEffect(() => {
    generateAvatar();
  }, [generateAvatar]);

  if (!avatarUrl) {
    return null;
  }

  return (
    <div
      className={`${styles["avatar-container"]} ${small ? styles.small : ""}`}
    >
      <img src={avatarUrl} alt="Address Avatar" />
    </div>
  );
};

export default Avatar;
