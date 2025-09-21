import React from "react";
import Card from "./Card";

interface LoadingCardProps {
  extraClass?: string;
}

const LoadingCard: React.FC<LoadingCardProps> = ({ extraClass = "" }) => {
  return (
    <Card extraClass={`loading-container ${extraClass}`}>
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    </Card>
  );
};

export default LoadingCard;
