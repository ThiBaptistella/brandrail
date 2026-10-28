import React from "react";
import classNames from "classnames";
import "./RadioInternal.css";
import { Size, ColorMode } from "../../types/global";

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Specifies whether the radio button is selected. */
  checked?: boolean;

  /** Disables the radio button. */
  disabled?: boolean;

  /** Adjusts the size of the radio button. */
  size?: Size;

  /** Defines whether the radio button uses light or dark mode. */
  colorMode?: ColorMode;

  /** Applies theme variations. */
  theme?: string;

  /** Function triggered when the radio button is selected. */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const RadioInternal: React.FC<RadioProps> = ({
  checked,
  disabled = false,
  size = Size.MEDIUM,
  colorMode = ColorMode.LIGHT,
  theme = "themeA",
  onChange,
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <label
      className={classNames(
        "radio",
        `radio-${size}`,
        { disabled },
        theme,
        colorMode
      )}
      data-theme={theme}
      data-color-mode={colorMode}
    >
      <input
        type="radio"
        className="radio-input"
        checked={checked}
        disabled={disabled}
        onChange={handleChange}
        {...props}
      />
      <span className={classNames("radio-icon", size)}></span>
    </label>
  );
};

export default RadioInternal;
