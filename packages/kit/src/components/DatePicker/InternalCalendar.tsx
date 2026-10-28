import React, { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isToday,
  isSameDay,
  isSameMonth,
} from "date-fns";
import classNames from "classnames";
import "./InternalCalendar.css";
import { ReactComponent as ChevronIcon } from "../../assets/iconset/chevron.svg";
import { ColorMode, Size } from "../../types/global";

export interface CalendarProps {
  /** The currently selected date in the calendar. */
  selectedDate?: Date | null;

  /** Callback function triggered when a date is selected. */
  onDateSelect: (date: Date) => void;

  /** Array of dates that contain events. */
  events?: Date[];

  /** Controls the calendar size. */
  size?: Size;

  /** Defines whether the component uses light or dark mode. */
  colorMode?: ColorMode;

  /** Applies theme variations. */
  theme?: string;

  /** Enables range selection mode. */
  isRange?: boolean;

  /** The selected date range, containing a start and end date. */
  range?: { start: Date | null; end: Date | null };

  /** Callback function triggered when a date range is selected. */
  onRangeSelect?: (range: { start: Date | null; end: Date | null }) => void;
}

const InternalCalendar: React.FC<CalendarProps> = ({
  selectedDate,
  onDateSelect,
  events,
  range = { start: null, end: null },
  size = Size.MEDIUM,
  colorMode = ColorMode.LIGHT,
  theme = "themeA",
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth)),
  });

  const isInRange = (day: Date) =>
    range.start && range.end && day >= range.start && day <= range.end;

  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div
      className={classNames("calendar", theme, colorMode)}
      data-theme={theme}
      data-color-mode={colorMode}
      role="dialog"
    >
      {/* Header */}
      <div className="calendar-header">
        <button onClick={handlePrevMonth} aria-label="Previous month">
          <span className={classNames("icon-left")}>
            <ChevronIcon />
          </span>
        </button>
        <span>{format(currentMonth, "MMMM d, yyyy")}</span>
        <button onClick={handleNextMonth} aria-label="Next month">
          <span className={classNames("icon-right")}>
            <ChevronIcon />
          </span>
        </button>
      </div>

      {/* Weekdays Row */}
      <div className="calendar-weekdays">
        {weekDays.map((day, index) => (
          <span key={index} className="weekday">
            {day}
          </span>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {days.map((day, index) => {
          const isCurrentDay = isToday(day);
          const isSelected = isSameDay(day, selectedDate || new Date());
          const hasEvent = events?.some((eventDate) =>
            isSameDay(eventDate, day)
          );
          const isStart = range.start && isSameDay(day, range.start);
          const isEnd = range.end && isSameDay(day, range.end);
          const inRange = isInRange(day);
          const isOutsideMonth = !isSameMonth(day, currentMonth);

          return (
            <button
              key={index}
              className={classNames(
                "calendar-day",
                isSelected ? "selected" : "",
                isCurrentDay ? "current-day" : "",
                hasEvent ? "event-day" : "",
                isStart ? "range-start" : "",
                isEnd ? "range-end" : "",
                inRange ? "in-range" : "",
                isOutsideMonth ? "outside-month" : "",
                `calendar-day-${size}`
              )}
              onClick={() => onDateSelect(day)}
            >
              <span
                className={classNames({
                  circle: isSelected || hasEvent || isStart || isEnd || inRange,
                })}
              >
                {format(day, "d")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default InternalCalendar;
