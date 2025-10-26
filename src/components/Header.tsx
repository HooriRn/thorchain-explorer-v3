import React from "react";
import styles from "./Header.module.css";

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <div className={styles["header-wrapper"]}>
      <h1>{title}</h1>
    </div>
  );
};

export default Header;
