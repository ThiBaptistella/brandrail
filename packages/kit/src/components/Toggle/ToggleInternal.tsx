import React, { useEffect, useState } from "react";
import classNames from "classnames";
import "./ToggleInternal.css";
import { Size, ColorMode } from "../../types/global";

export interface ToggleProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "size" | "onChange"
  > {
  /** Defines if the toggle is checked (on or off). */
  checked?: boolean;

  /** Disables the toggle, preventing user interaction. */
  disabled?: boolean;

  /** Adjusts the size of the toggle. */
  size?: Size;

  /** Defines whether the toggle uses light or dark mode. */
  colorMode?: ColorMode;

  /** Applies theme variations to the toggle. */
  theme?: string;

  /** Callback function triggered when the toggle state changes. */
  onChange?: (checked: boolean) => void;
}

const ToggleInternal: React.FC<ToggleProps> = ({
  checked = false,
  disabled = false,
  size = Size.MEDIUM,
  colorMode = ColorMode.LIGHT,
  theme = "themeA",
  onChange,
  ...props
}) => {
  const [isChecked, setIsChecked] = useState(checked);

  useEffect(() => {
    setIsChecked(checked);
  }, [checked]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const newChecked = event.target.checked;
    setIsChecked(newChecked);
    if (onChange) onChange(newChecked);
  };

  return (
    <label
      data-testid="toggle-wrapper"
      className={classNames("toggle", `toggle-${size}`, theme, colorMode, {
        "toggle-checked": isChecked,
        "toggle-disabled": disabled,
      })}
      data-theme={theme}
      data-color-mode={colorMode}
    >
      <input
        type="checkbox"
        className="toggle-input"
        checked={isChecked}
        disabled={disabled}
        onChange={handleChange}
        {...props}
      />
      <span className="toggle-slider" />
    </label>
  );
};

export default ToggleInternal;
