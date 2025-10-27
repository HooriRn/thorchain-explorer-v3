"use client";

import React, { useMemo, useState } from "react";
import styles from "./NewPagination.module.css";

interface NewPaginationProps {
  totalRows: number;
  perPage?: number;
  currentPage?: number;
  onChange?: (page: number) => void;
}

const NewPagination: React.FC<NewPaginationProps> = ({
  totalRows,
  perPage = 30,
  currentPage: controlledCurrentPage,
  onChange,
}) => {
  const [internalPage, setInternalPage] = useState(1);

  const currentPage =
    controlledCurrentPage !== undefined ? controlledCurrentPage : internalPage;

  const limitedTotalRows = useMemo(() => {
    const maxPages = 200;
    const maxRows = maxPages * perPage;
    return Math.min(totalRows, maxRows);
  }, [totalRows, perPage]);

  const totalPages = Math.ceil(limitedTotalRows / perPage);

  const handlePageChange = (newPage: number) => {
    if (controlledCurrentPage === undefined) {
      setInternalPage(newPage);
    }
    if (onChange) {
      onChange(newPage);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showFirstLast = totalPages > 7;

    if (!showFirstLast) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 4) {
        pages.push("...");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 3) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={styles.overflowAuto}>
      <div className={styles.customPagination}>
        <button
          className={styles.pageItem}
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          Previous
        </button>

        {pageNumbers.map((page, index) => {
          if (page === "...") {
            return (
              <span key={`ellipsis-${index}`} className={styles.ellipsis}>
                ...
              </span>
            );
          }

          return (
            <button
              key={page}
              className={`${styles.pageItem} ${
                currentPage === page ? styles.active : ""
              }`}
              onClick={() => typeof page === "number" && handlePageChange(page)}
            >
              {page}
            </button>
          );
        })}

        <button
          className={styles.pageItem}
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default NewPagination;
