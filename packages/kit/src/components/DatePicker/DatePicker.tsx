import React, { useState, useRef } from "react";
import classNames from "classnames";
import { format, parse, isValid } from "date-fns";
import "./DatePicker.css";
import InternalCalendar from "./InternalCalendar";
import { ReactComponent as CalendarIcon } from "../../assets/iconset/calendar.svg";
import { ColorMode, Size } from "../../types/global";
export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface DatePickerProps {
  /** The currently selected date. */
  selectedDate?: Date | null;

  /** Callback function triggered when a new date is selected. */
  onChange?: (date: Date | null) => void;

  /** Placeholder text displayed inside the input field. */
  placeholder?: string;

  /** Custom format for the displayed date. */
  formatPattern?: string;

  /** Disables the DatePicker input field. */
  disabled?: boolean;

  /** Defines the size of the DatePicker. */
  size?: Size;

  /** Defines whether the DatePicker uses light or dark mode. */
  colorMode?: ColorMode;

  /** Applies theme variations. */
  theme?: string;

  /** Array of dates to highlight as events. */
  events?: Date[];

  /** Enables date range selection. */
  isRange?: boolean;

  /** Defines the selected date range (start and end). */
  range?: DateRange;

  /** Callback function triggered when a date range is selected. */
  onRangeSelect?: (range: DateRange) => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate,
  onChange,
  placeholder = "Select a date",
  formatPattern = "MMMM d, yyyy",
  disabled = false,
  size = Size.MEDIUM,
  colorMode = ColorMode.LIGHT,
  theme = "themeA",
  events = [],
  isRange = false,
  range = { start: null, end: null },
  onRangeSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>(range);
  const inputRef = useRef<HTMLInputElement>(null);

  // Correctly format input value based on mode
  const inputValue = isRange
    ? selectedRange.start && selectedRange.end
      ? `${format(selectedRange.start, formatPattern)} - ${format(
          selectedRange.end,
          formatPattern
        )}`
      : selectedRange.start
      ? `${format(selectedRange.start, formatPattern)} - ...`
      : ""
    : selectedDate
    ? format(selectedDate, formatPattern)
    : "";

  const handleDateClick = (date: Date) => {
    if (isRange) {
      if (!selectedRange.start || selectedRange.end) {
        // Start a new range selection
        setSelectedRange({ start: date, end: null });
        onRangeSelect?.({ start: date, end: null });
      } else if (date > selectedRange.start) {
        // Complete the range
        setSelectedRange({ start: selectedRange.start, end: date });
        onRangeSelect?.({ start: selectedRange.start, end: date });
      } else {
        // Reset start if clicked earlier
        setSelectedRange({ start: date, end: null });
        onRangeSelect?.({ start: date, end: null });
      }
    } else {
      // Single date selection
      setIsOpen(false);
      onChange?.(date);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsedDate = parse(e.target.value, formatPattern, new Date());
    if (isValid(parsedDate)) {
      onChange?.(parsedDate);
    }
  };

  return (
    <div
      className={classNames("datepicker", theme, colorMode)}
      data-theme={theme}
      data-color-mode={colorMode}
    >
      <div
        className={classNames(
          "datepicker-input-wrapper",
          `datepicker-input-${size}`,
          { disabled },
          { isOpen }
        )}
      >
        <input
          ref={inputRef}
          type="text"
          className={classNames("datepicker-input", { disabled })}
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          readOnly
        />
        <button
          type="button"
          className="datepicker-icon"
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          disabled={disabled}
        >
          <span className="icon">
            <CalendarIcon />
          </span>
        </button>
      </div>

      {isOpen && (
        <InternalCalendar
          selectedDate={selectedDate}
          onDateSelect={handleDateClick}
          events={events}
          isRange={isRange}
          range={selectedRange}
          onRangeSelect={setSelectedRange}
          size={size}
          theme={theme}
          colorMode={colorMode}
        />
      )}
    </div>
  );
};

export default DatePicker;
