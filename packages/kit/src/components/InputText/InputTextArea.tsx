import React, { ReactElement, useMemo } from "react";
import classNames from "classnames";
import "./InputTextArea.css";
import Caption, { CaptionProps } from "./Caption";
import { ColorMode, Size, State } from "../../types/global";

export interface InputTextAreaProps {
  /** The label displayed above the text area. */
  label?: string;

  /** Placeholder text inside the text area. */
  placeholder?: string;

  /** Controls the text area value. */
  value?: string;

  /** Function triggered when the value changes. */
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;

  /** Adjusts the size of the text area. */
  size?: Size;

  /** Determines the current state of the text area. */
  state?: State;

  /** Provides an additional caption with optional status. */
  caption?: Omit<CaptionProps, "icon">;

  /** Adds an icon inside the caption. */
  iconCaption?: ReactElement;

  /** Defines whether the text area uses light or dark mode. */
  colorMode?: ColorMode;

  /** Applies theme variations. */
  theme?: string;
}

const InputTextArea: React.FC<InputTextAreaProps> = ({
  label,
  placeholder = "Enter text...",
  value,
  onChange,
  size = Size.MEDIUM,
  state = State.DEFAULT,
  caption,
  iconCaption,
  colorMode = ColorMode.LIGHT,
  theme = "themeA",
}) => {
  return (
    <div
      className={classNames(
        "textarea-container",
        `textarea-${state}`,
        size,
        theme,
        colorMode
      )}
      data-theme={theme}
      data-color-mode={colorMode}
    >
      {label && <label className="textarea-label">{label}</label>}
      <textarea
        className="textarea"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
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

export default InputTextArea;
