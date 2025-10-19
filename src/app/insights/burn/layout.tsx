import React from "react";

interface BurnLayoutProps {
  children: React.ReactNode;
}

const BurnLayout: React.FC<BurnLayoutProps> = ({ children }) => {
  return <div className="burn-page-layout">{children}</div>;
};

export default BurnLayout;
