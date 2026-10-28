import React, { ReactElement } from "react";
import classNames from "classnames";
import "./Button.css";
import { ColorMode, Size } from "../../types/global";

export enum ButtonType {
  CTA = "cta",
  GHOST = "ghost",
  DANGER = "danger",
}

export interface ButtonProps {
  /** The text displayed inside the button. */
  label: string;

  /** Applies theme variations to the button. */
  theme?: string;

  /** Defines whether the button uses light or dark mode. */
  colorMode?: ColorMode;

  /** Adds an icon before the button label. */
  iconLeft?: ReactElement;

  /** Adds an icon after the button label. */
  iconRight?: ReactElement;

  /** Defines the button type (e.g., "button", "submit", "reset"). */
  type?: ButtonType;

  /** Adjusts the button size. */
  size?: Size;

  /** Disables the button, preventing user interaction. */
  disabled?: boolean;

  /** Function triggered when the button is clicked. */
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  colorMode = ColorMode.LIGHT,
  theme = "themeA",
  type = ButtonType.CTA,
  size = Size.MEDIUM,
  disabled = false,
  iconLeft,
  iconRight,
  onClick,
  ...props
}) => {
  return (
    <button
      className={classNames(
        "buttonContainer",
        `button-${size}`,
        `button-${type}`,
        theme,
        colorMode
      )}
      onClick={onClick}
      data-theme={theme}
      data-color-mode={colorMode}
      aria-pressed={disabled ? undefined : false}
      disabled={disabled}
      {...props}
    >
      {iconLeft && (
        <span
          className={classNames("icon", `${size}`)}
          data-testid="breadcrumb-icon"
        >
          {iconLeft}
        </span>
      )}

      {label}

      {iconRight && (
        <span
          className={classNames("icon", `${size}`)}
          data-testid="breadcrumb-icon"
        >
          {iconRight}
        </span>
      )}
    </button>
  );
};

export default Button;
