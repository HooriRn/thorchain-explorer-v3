import React, { useMemo } from "react";
import styles from "./TableLoader.module.css";

interface Column {
  label: string;
  field: string;
  type?: string;
  sortable?: boolean;
}

interface TableLoaderProps {
  cols: Column[];
}

const TableLoader: React.FC<TableLoaderProps> = ({ cols }) => {
  const limitedRows = useMemo(() => {
    const range = 8; 
    const rows = [];
    for (let i = 0; i < range; i++) {
      rows.push({
        id: i,
      });
    }
    return rows;
  }, []);

  const getSkeletonWidth = () => {
    
    return "70%";
  };

  return (
    <div>
      <table className={styles.table}>
        <thead>
          <tr>
            {cols.map((col, index) => (
              <th key={index}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {limitedRows.map((row) => (
            <tr key={row.id}>
              {cols.map((col, colIndex) => (
                <td key={colIndex}>
                  <div
                    className={[
                      styles.cellContent,
                      {
                        [styles.rightAlign]:
                          col.type === "number" || col.type === "percentage",
                      },
                    ].join(" ")}
                  >
                    <div
                      className={styles.skeletonBar}
                      style={{
                        width: getSkeletonWidth(),
                        animationDelay: `${colIndex * 0.1}s`, 
                      }}
                    />
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableLoader;
