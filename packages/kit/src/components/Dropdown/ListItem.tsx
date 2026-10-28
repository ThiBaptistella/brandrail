import React, { ReactElement } from "react";
import classNames from "classnames";
import "./ListItem.css";
import { ColorMode, Size } from "../../types/global";

export interface ListItemProps {
  /** The text displayed inside the list item. */
  label: string;

  /** The unique value associated with the list item. */
  value: string | number;

  /** Additional descriptive text below the main label. */
  caption?: string;

  /** Adds an icon before the label. */
  iconLeft?: ReactElement;

  /** Adds an icon after the label. */
  iconRight?: ReactElement;

  /** Marks the item as selected. */
  selected?: boolean;

  /** Adjusts the size of the list item. */
  size?: Size;

  /** Defines whether the list item uses light or dark mode. */
  colorMode?: ColorMode;

  /** Applies theme variations. */
  theme?: string;

  /** Disables interactions with the list item. */
  disabled?: boolean;

  /** Function triggered when the list item is selected. */
  onSelect?: (value: string | number) => void;
}

export const ListItem: React.FC<ListItemProps> = ({
  label,
  value,
  caption,
  iconLeft,
  iconRight,
  selected = false,
  size = Size.MEDIUM,
  theme = "themeA",
  colorMode = ColorMode.LIGHT,
  disabled = false,
  onSelect,
}) => {
  return (
    <li
      className={classNames(
        "dropdown-list-item",
        `dropdown-list-item-${size}`,
        theme,
        colorMode,
        {
          selected,
          disabled,
        }
      )}
      onClick={() => !disabled && onSelect?.(value)}
      role="option"
      aria-selected={selected}
      aria-disabled={disabled}
    >
      <div className="left-content">
        {iconLeft && (
          <span className="icon" data-testid="icon">
            {iconLeft}
          </span>
        )}
        <span>{label}</span>
      </div>
      <div className="right-content">
        {caption && <span className="caption">{caption}</span>}
        {iconRight && (
          <span className="icon" data-testid="icon">
            {iconRight}
          </span>
        )}
      </div>
    </li>
  );
};

export default ListItem;
