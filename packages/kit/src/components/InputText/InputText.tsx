import React, { ReactElement } from "react";
import classNames from "classnames";
import "./InputText.css";
import Caption, { CaptionProps } from "./Caption";
import { Size, State, ColorMode } from "../../types/global";

export enum InputTextType {
  TEXT = "text",
  NUMBER = "number",
  PASSWORD = "password",
}

export interface InputTextProps {
  /** The label displayed above the input field. */
  label?: string;

  /** Placeholder text inside the input field. */
  placeholder?: string;

  /** Controls the input value. */
  value?: string;

  /** Defines the type of input field. */
  type?: InputTextType;

  /** Function triggered when the value changes. */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;

  /** Adjusts the size of the input field. */
  size?: Size;

  /** Determines the current state of the input field. */
  state?: State;

  /** Adds an icon before the input field. */
  iconLeft?: ReactElement;

  /** Adds an icon after the input field. */
  iconRight?: ReactElement;

  /** Provides an additional caption with optional status. */
  caption?: Omit<CaptionProps, "icon">;

  /** Adds an icon inside the caption. */
  iconCaption?: ReactElement;

  /** Defines whether the input field uses light or dark mode. */
  colorMode?: ColorMode;

  /** Applies theme variations. */
  theme?: string;
}

const InputText: React.FC<InputTextProps> = ({
  label,
  placeholder = "Enter text...",
  value,
  type = InputTextType.TEXT,
  onChange,
  size = Size.MEDIUM,
  state = State.DEFAULT,
  iconLeft,
  iconRight,
  caption,
  iconCaption,
  colorMode = ColorMode.LIGHT,
  theme = "themeA",
}) => {
  return (
    <div
      className={classNames(
        "input-container",
        `input-${state}`,
        size,
        theme,
        colorMode
      )}
      data-theme={theme}
      data-color-mode={colorMode}
    >
      {label && (
        <label className={classNames("input-label", size)}>{label}</label>
      )}
      <div className="input-wrapper">
        {iconLeft && <span className="input-icon-left">{iconLeft}</span>}
        <input
          type={type}
          className="input-text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={state === "disabled"}
        />
        {iconRight && <span className="input-icon-right">{iconRight}</span>}
      </div>
      {caption && (
        <Caption
          theme={theme}
          colorMode={colorMode as ColorMode}
          size={size as Size}
          icon={iconCaption}
          {...caption}
        />
      )}
    </div>
  );
};

export default InputText;
