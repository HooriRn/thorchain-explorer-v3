import React from "react";
import "./Dot.css";

interface DotLiveProps {
  color?: string;
}

const DotLive: React.FC<DotLiveProps> = ({ color }) => {
  const style = {
    "--dot-color": color || "var(--primary-color)",
  };

  return <div className="dot" style={style}></div>;
};

export default DotLive;
