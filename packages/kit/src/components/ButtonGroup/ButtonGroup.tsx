import React, { forwardRef, ReactElement, useEffect, useRef } from "react";
import classNames from "classnames";
import "./ButtonGroup.css";
import { ButtonProps } from "../Button/Button";
import { ColorMode, Size, Orientation } from "../../types/global";

export interface ButtonGroupProps {
  children: ReactElement<ButtonProps> | ReactElement<ButtonProps>[];
  size?: Size;
  colorMode?: ColorMode;
  theme?: string;
  orientation?: Orientation;
}

export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  (
    {
      children,
      size = Size.MEDIUM,
      colorMode = ColorMode.LIGHT,
      theme = "themeA",
      orientation = Orientation.HORIZONTAL,
    },
    ref
  ) => {
    const internalRef = useRef<HTMLDivElement>(null);

    return (
      <div
        ref={ref || internalRef}
        className={classNames(
          "button-group",
          `group-${orientation}`,
          theme,
          colorMode
        )}
        role="group"
        aria-label="Button Group"
        data-theme={theme}
        data-color-mode={colorMode}
      >
        {React.Children.map(children, (child, index) => {
          return React.cloneElement(child, {
            ...child.props,
            size,
            theme,
            tabIndex: index === 0 ? 0 : -1,
          } as ButtonProps);
        })}
      </div>
    );
  }
);

export default ButtonGroup;
