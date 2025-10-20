"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import styles from "./VoteList.module.css";

interface VoteListProps {
  addresses: string[];
  color?: string;
  searchQuery?: string;
}

const VoteList: React.FC<VoteListProps> = ({
  addresses,
  color,
  searchQuery = "",
}) => {
  const [show, setShow] = useState(false);

  const filteredAddresses = useMemo(() => {
    if (!searchQuery) {
      return addresses;
    }
    const query = searchQuery.toLowerCase();
    return addresses.filter((address) => address.toLowerCase().includes(query));
  }, [addresses, searchQuery]);

  const formatAddress = (address: string) => {
    return address.slice(-4);
  };

  return (
    <div className={styles.voteList}>
      {filteredAddresses.slice(0, 6).map((address, idx) => (
        <Link key={idx} href={`/address/${address}`}>
          <Badge
            style={{
              backgroundColor: color,
              borderRadius: "999px",
            }}
          >
            {formatAddress(address)}
          </Badge>
        </Link>
      ))}
      {filteredAddresses.length > 6 && !show && (
        <button className={styles.moreButton} onClick={() => setShow(true)}>
          +{filteredAddresses.length - 6} more
        </button>
      )}
      {show && (
        <>
          {filteredAddresses.slice(6).map((address, idx) => (
            <Link key={idx + 6} href={`/address/${address}`}>
              <Badge
                style={{
                  backgroundColor: color,
                  borderRadius: "999px",
                }}
              >
                {formatAddress(address)}
              </Badge>
            </Link>
          ))}
          <button className={styles.moreButton} onClick={() => setShow(false)}>
            Show Less
          </button>
        </>
      )}
    </div>
  );
};

export default VoteList;
