import React from "react";
import classNames from "classnames";
import "./Radio.css";
import RadioInternal, { RadioProps } from "./RadioInternal";
import { Size, ColorMode } from "../../types/global";

export interface RadioLabelProps extends RadioProps {
  /** The text displayed beside the radio button. */
  label?: string;
}

export const Radio: React.FC<RadioLabelProps> = ({
  label,
  checked = false,
  disabled = false,
  size = Size.MEDIUM,
  colorMode = ColorMode.LIGHT,
  theme = "themeA",
  onChange,
  ...props
}) => {
  const handleClick = () => {
    if (!disabled && onChange) {
      onChange({
        target: { checked: true },
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  return (
    <label
      onClick={handleClick}
      className={classNames("radio-label", size, colorMode, theme, {
        disabled,
      })}
      data-theme={theme}
      data-color-mode={colorMode}
    >
      <RadioInternal
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        {...props}
      />
      <span className="radio-text">{label}</span>
    </label>
  );
};

export default Radio;
