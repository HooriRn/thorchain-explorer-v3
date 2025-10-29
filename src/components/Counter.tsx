"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import moment from "moment";
import Card from "@/components/ui/Card";
import ClockIcon from "@/assets/images/clock.svg";
import CalendarIcon from "@/assets/images/calendar.svg";
import styles from "./Counter.module.css";

interface CounterProps {
  counter: number; 
  halted?: boolean;
  title: string;
  visibleUnits?: string[];
}

const Counter: React.FC<CounterProps> = ({
  counter,
  halted = false,
  title = "Countdown",
  visibleUnits = ["Days", "Hours", "Minutes", "Seconds"],
}) => {
  const BLOCK_TIME_SECONDS = 6;

  const [blockRemainingTime, setBlockRemainingTime] = useState(
    moment.duration(0, "seconds")
  );
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (counter > 0) {
      const newDuration = counter * BLOCK_TIME_SECONDS;
      setDuration(newDuration);

      if (!timerRef.current) {
        startCountdown();
      }
    } else {
      setDuration(0);
      setBlockRemainingTime(moment.duration(0, "seconds"));
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [counter]);

  const startCountdown = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setDuration((prevDuration) => {
        const newDuration = Math.max(0, prevDuration - 1);
        setBlockRemainingTime(moment.duration(newDuration, "seconds"));
        return newDuration;
      });
    }, 1000);
  };

  const timeUnits = useMemo(() => {
    return {
      Years: blockRemainingTime?.years().toString().padStart(2, "0"),
      Months: blockRemainingTime?.months().toString().padStart(2, "0"),
      Days: blockRemainingTime?.days().toString().padStart(2, "0"),
      Hours: blockRemainingTime?.hours().toString().padStart(2, "0"),
      Minutes: blockRemainingTime?.minutes().toString().padStart(2, "0"),
      Seconds: blockRemainingTime?.seconds().toString().padStart(2, "0"),
    };
  }, [blockRemainingTime]);

  const targetDate = useMemo(() => {
    return moment().add(duration, "seconds").format("YYYY MMM D, HH:mm");
  }, [duration]);

  const getVisibleUnits = (units: Record<string, string>) => {
    return Object.entries(units).filter(([unit]) => {
      return visibleUnits.includes(unit);
    });
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return (
    <div className={styles["timer-component"]}>
      <Card extraClass={styles["counter-container"]}>
        <div className={styles["counter-items"]}>
          <div className={styles["timer-items"]}>
            <div className={styles["Countdown-title"]}>
              <ClockIcon className={styles["timer-icon"]} />
              <strong>{title}</strong>
            </div>

            <div className={styles.timers} role="timer" aria-live="polite">
              {!halted ? (
                getVisibleUnits(timeUnits).map(([unit, value], index) => (
                  <div key={unit} className={styles["duration-wrapper"]}>
                    <div
                      className={styles.duration}
                      aria-label={`${value} ${unit}`}
                    >
                      <small>{unit}</small>
                      <strong>{value}</strong>
                    </div>
                    {index < getVisibleUnits(timeUnits).length - 1 && (
                      <div
                        className={styles.separator}
                        aria-hidden="true"
                      ></div>
                    )}
                  </div>
                ))
              ) : (
                <strong className={styles.halted}>Halted</strong>
              )}
            </div>
          </div>
          <div className={styles.line}></div>
          <div className={styles["target-info"]}>
            <div className={styles["target-title"]}>
              <CalendarIcon className={styles["target-icon"]} />
              <strong>Target Date</strong>
            </div>
            <p>{targetDate}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Counter;
