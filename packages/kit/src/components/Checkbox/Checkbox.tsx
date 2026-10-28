import React from "react";
import classNames from "classnames";
import CheckboxInternal, { CheckboxProps } from "./CheckboxInternal";
import "./Checkbox.css";
import { ColorMode, Size } from "../../types/global";

export interface CheckboxLabelProps extends CheckboxProps {
  /** The label text displayed next to the checkbox. */
  label?: string;
}

export const Checkbox: React.FC<CheckboxLabelProps> = ({
  label,
  checked = false,
  disabled = false,
  size = Size.MEDIUM,
  colorMode = ColorMode.LIGHT,
  theme = "themeA",
  id,
  onChange,
  ...props
}) => {
  const checkboxId =
    id || `checkbox-${label?.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <label
      htmlFor={checkboxId}
      className={classNames(
        "checkbox-label",
        `checkbox-label-${size}`,
        theme,
        colorMode,
        {
          disabled,
        }
      )}
      data-theme={theme}
      data-color-mode={colorMode}
    >
      <CheckboxInternal
        id={checkboxId}
        checked={checked}
        disabled={disabled}
        size={size}
        onChange={onChange}
        {...props}
      />
      <span className="checkbox-text">{label}</span>
    </label>
  );
};

export default Checkbox;
