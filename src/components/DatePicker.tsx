"use client";

import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from "./DatePicker.module.css";

interface DatePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (dates: [Date | null, Date | null]) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  allowSameDay?: boolean;
  minDate?: Date;
  maxDate?: Date;
  monthsShown?: number;
}

const CustomDatePicker: React.FC<DatePickerProps> = ({
  startDate,
  endDate,
  onChange,
  placeholder = "Select date range",
  disabled = false,
  label,
  allowSameDay = false,
  minDate,
  maxDate,
  monthsShown = 2,
}) => {
  return (
    <div className={styles.inputGroup}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.datePickerContainer}>
        <DatePicker
          selected={startDate}
          onChange={onChange}
          startDate={startDate}
          endDate={endDate}
          selectsRange
          disabled={disabled}
          isClearable
          placeholderText={placeholder}
          className={styles.datePickerInput}
          calendarClassName={styles.calendar}
          dateFormat="dd/MM/yyyy"
          allowSameDay={allowSameDay}
          minDate={minDate}
          maxDate={maxDate}
          monthsShown={monthsShown}
        />
      </div>
    </div>
  );
};

export default CustomDatePicker;
