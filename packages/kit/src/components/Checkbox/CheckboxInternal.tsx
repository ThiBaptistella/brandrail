import React, { useEffect, useRef } from "react";
import classNames from "classnames";
import "./CheckboxInternal.css";
import { ColorMode, Size } from "../../types/global";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Determines if the checkbox is checked or unchecked. */
  checked?: boolean;

  /** Sets the checkbox to an indeterminate state. */
  indeterminate?: boolean;

  /** Disables the checkbox, making it unclickable. */
  disabled?: boolean;

  /** Adjusts the size of the checkbox. */
  size?: Size;

  /** Defines whether the checkbox uses light or dark mode. */
  colorMode?: ColorMode;

  /** Applies a custom theme variation. */
  theme?: string;

  /** Function triggered when a selection is made. */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CheckboxInternal: React.FC<CheckboxProps> = ({
  checked = false,
  indeterminate = false,
  disabled = false,
  size = Size.MEDIUM,
  colorMode = ColorMode.LIGHT,
  theme = "themeA",
  onChange,
  ...props
}) => {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (indeterminate || disabled) {
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
        "checkbox",
        `checkbox-${size}`,
        { disabled },
        theme,
        colorMode
      )}
      data-theme={theme}
      data-color-mode={colorMode}
    >
      <input
        ref={checkboxRef}
        type="checkbox"
        className="checkbox-input"
        checked={indeterminate || checked}
        disabled={disabled}
        aria-checked={indeterminate ? "mixed" : checked}
        onChange={handleChange}
        {...props}
      />
      <span className="checkbox-icon">
        {!disabled && (
          <>
            {indeterminate ? (
              // Indeterminate Icon (Only if not disabled)
              <div className="icon-indeterminate" role="img">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="8"
                  height="2"
                  viewBox="0 0 8 2"
                  fill="none"
                >
                  <path d="M8 0.333H0V1.666H8V0.333Z" fill="white" />
                </svg>
              </div>
            ) : checked ? (
              // Checked Icon (Only if not disabled)
              <div className="icon-checked" role="img">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="12"
                  viewBox="0 0 16 12"
                  fill="none"
                >
                  <path
                    d="M5.2 11.6866C4.9374 11.6871 4.6773 11.6356 4.43465 11.5353C4.192 11.435 3.97155 11.2877 3.786 11.1019L0.0573263 7.3739L1 6.43057L4.72866 10.1592C4.85368 10.2842 5.02322 10.3544 5.2 10.3544C5.37677 10.3544 5.54631 10.2842 5.67133 10.1592L15 0.830566L15.9427 1.77323L6.614 11.1019C6.42845 11.2877 6.20801 11.435 5.96535 11.5353C5.7227 11.6356 5.4626 11.6871 5.2 11.6866Z"
                    fill="white"
                  />
                </svg>
              </div>
            ) : null}
          </>
        )}
      </span>
    </label>
  );
};

export default CheckboxInternal;
