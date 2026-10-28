import React, {
  useState,
  useRef,
  useEffect,
  ReactElement,
  Children,
  isValidElement,
  cloneElement,
} from "react";
import classNames from "classnames";
import "./Dropdown.css";
import { ListItemProps } from "./ListItem";
import { ReactComponent as ChevronIcon } from "../../assets/iconset/chevron.svg";
import { ColorMode, Size } from "../../types/global";

export interface DropdownProps {
  /** Accepts `ListItem` components directly as children. */
  children: ReactElement<ListItemProps> | ReactElement<ListItemProps>[];

  /** Controls the selected index of the dropdown. */
  selected?: number;

  /** Function triggered when a selection is made (returns index). */
  onChange?: (index: number) => void;

  /** Adjusts the dropdown size. */
  size?: Size;

  /** Defines whether the dropdown uses light or dark mode. */
  colorMode?: ColorMode;

  /** Applies theme variations. */
  theme?: string;

  /** Disables the dropdown, preventing user interaction. */
  disabled?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
  children,
  selected = 0,
  onChange,
  size = Size.MEDIUM,
  colorMode = ColorMode.LIGHT,
  theme = "themeA",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(selected);

  useEffect(() => {
    setSelectedIndex(selected);
  }, [selected]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Extract `ListItem` components correctly
  const listItems = Children.toArray(children).filter(
    isValidElement
  ) as ReactElement<ListItemProps>[];

  // Handle selection by index
  const handleSelect = (index: number) => {
    setSelectedIndex(index);
    if (onChange) onChange(index);
    setIsOpen(false);
  };

  return (
    <div
      className={classNames("dropdown", theme, colorMode)}
      ref={dropdownRef}
      data-theme={theme}
      data-color-mode={colorMode}
    >
      {/* Dropdown Trigger */}
      <button
        className={classNames("dropdown-trigger", `dropdown-${size}`)}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        aria-disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="select">
          {listItems[selectedIndex]?.props.label || "Select an option"}
        </span>
        <span className={classNames("icon", isOpen ? "" : "open")}>
          <ChevronIcon />
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <ul className="dropdown-list" role="listbox">
          {listItems.map((item, index) =>
            cloneElement(item, {
              onSelect: () => handleSelect(index),
              selected: index === selectedIndex,
            })
          )}
        </ul>
      )}
    </div>
  );
};

export default Dropdown;
