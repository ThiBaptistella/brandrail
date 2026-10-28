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
import "./Calendar.css";
import { ReactComponent as ChevronIcon } from "../../assets/iconset/chevron.svg";
import { ReactComponent as PlusIcon } from "../../assets/iconset/plus.svg";
import Dropdown from "../Dropdown/Dropdown";
import ListItem from "../Dropdown/ListItem";
import Button from "../Button/Button";
import { ColorMode, Size } from "../../types/global";

export interface CalendarEvent {
  date: Date;
  title: string;
  description?: string;
}

export interface CalendarExpandedProps {
  /** The currently selected date in the calendar. */
  selectedDate?: Date | null;

  /** Callback function triggered when a date is selected. */
  onDateSelect?: (date: Date) => void;

  /** List of events associated with specific dates. */
  eventDate?: CalendarEvent[];

  /** Adjusts the calendar size. */
  size?: Size;

  /** Defines whether the calendar uses light or dark mode. */
  colorMode?: ColorMode;

  /** Applies theme variations. */
  theme?: string;

  /** Callback function triggered when adding a new event. */
  onNewEventClick?: () => void;
}

const Calendar: React.FC<CalendarExpandedProps> = ({
  selectedDate: controlledSelectedDate,
  onDateSelect,
  eventDate = [],
  size = Size.MEDIUM,
  colorMode = ColorMode.LIGHT,
  theme = "themeA",
  onNewEventClick,
}) => {
  const [internalSelectedDate, setInternalSelectedDate] = useState<Date | null>(
    controlledSelectedDate ?? new Date()
  );
  const [currentMonth, setCurrentMonth] = useState(
    controlledSelectedDate ?? new Date()
  );

  const selectedDate = controlledSelectedDate ?? internalSelectedDate;

  const handleDateSelect = (date: Date) => {
    if (onDateSelect) {
      onDateSelect(date);
    } else {
      setInternalSelectedDate(date);
    }

    setCurrentMonth(date);
  };

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth)),
  });

  const months = Array.from({ length: 12 }, (_, index) => ({
    label: format(new Date(2025, index, 1), "MMMM"),
    value: index,
  }));

  const weekDays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // Find the selected month index based on the current date
  const selectedMonthIndex = months.findIndex(
    (month) => month.value === currentMonth.getMonth()
  );

  return (
    <div
      className={classNames("calendar-expanded", theme, colorMode)}
      data-theme={theme}
      data-color-mode={colorMode}
    >
      <div className="calendar-header">
        <span className="calendar-header-date">
          {format(currentMonth, "MMMM d, yyyy")}
        </span>

        <div className="calendar-header-controls">
          <Dropdown
            size={size as Size}
            theme={theme}
            colorMode={colorMode as ColorMode}
            selected={selectedMonthIndex} // Selected by index
            onChange={(index) => {
              const selectedMonth = months[index].value;
              setCurrentMonth(
                new Date(currentMonth.getFullYear(), selectedMonth, 1)
              );
            }}
          >
            {months.map((month) => (
              <ListItem
                key={month.value}
                value={month.value}
                label={month.label}
              />
            ))}
          </Dropdown>

          <div className="calendar-navigation">
            <button
              className="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              aria-label="Previous month"
            >
              <ChevronIcon className="icon-left" />
            </button>
            <span
              onClick={() => setCurrentMonth(new Date())}
              className="calendar-today"
              aria-label="Today button"
            >
              Today
            </span>
            <button
              className="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              aria-label="Next month"
            >
              <ChevronIcon className="icon-right" />
            </button>
          </div>

          <Button
            size={size as Size}
            theme={theme}
            label="New Event"
            iconRight={<PlusIcon />}
            onClick={onNewEventClick}
          />
        </div>
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
          const event = eventDate.find((event) => isSameDay(event.date, day));
          const isOutsideMonth = !isSameMonth(day, currentMonth);

          return (
            <button
              key={index}
              className={classNames("calendar-day", {
                selected: isSelected,
                "current-day": isCurrentDay,
                "event-day": event,
                "outside-month": isOutsideMonth,
              })}
              onClick={() => handleDateSelect(day)}
            >
              <span className={classNames("day", { circle: event })}>
                {format(day, "d")}
                {isCurrentDay && !isSelected && (
                  <div className="current-day-circle" />
                )}
              </span>

              {event &&
                (isSelected || isCurrentDay || isOutsideMonth || event) && (
                  <div className="event-info">
                    <strong>{event.title}</strong>
                    {event.description && <p>{event.description}</p>}
                  </div>
                )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
