import React from "react";

interface ColorHashProps {
  name: string;
  size?: number;
  className?: string;
}

const ColorHash: React.FC<ColorHashProps> = ({
  name,
  size = 12,
  className = "",
}) => {
  const generateColor = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 60%)`;
  };

  const backgroundColor = generateColor(name);

  return (
    <div
      className={className}
      style={{
        backgroundColor,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        display: "inline-block",
        flexShrink: 0,
      }}
      title={`Vault color for ${name}`}
    />
  );
};

export default ColorHash;
