import React, { ReactNode } from "react";
import classNames from "classnames";
import "./List.css";
import { ListItemProps } from "./ListItem";
import { ColorMode, Size } from "../../types/global";

export interface ListProps {
  /** Accepts `ListItem` components as children. */
  children: ReactNode;

  /** Controls the selected item(s) in the dropdown list. */
  selected?: number;

  /** Adjusts the size of the dropdown list. */
  size?: Size;

  /** Defines whether the dropdown list uses light or dark mode. */
  colorMode?: ColorMode;

  /** Applies theme variations. */
  theme?: string;

  /** Callback function triggered when a selection is made. */
  onSelect?: (index: number) => void;
}

export const List: React.FC<ListProps> = ({
  children,
  selected = 0,
  size = Size.MEDIUM,
  colorMode = ColorMode.LIGHT,
  theme = "themeA",
  onSelect,
}) => {
  return (
    <ul
      className={classNames("dropdown-list", theme, colorMode)}
      data-theme={theme}
      data-color-mode={colorMode}
      role="listbox"
    >
      {React.Children.map(children, (child, index) =>
        React.isValidElement<ListItemProps>(child)
          ? React.cloneElement(child, {
              onSelect: () => onSelect?.(index),
              selected: index === selected,
              size,
              theme,
              colorMode,
            })
          : child
      )}
    </ul>
  );
};

export default List;
