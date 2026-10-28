import React, { ReactElement } from "react";
import classNames from "classnames";
import CheckboxInternal, { CheckboxProps } from "./CheckboxInternal";
import "./CheckboxButton.css";
import { ColorMode, Size } from "../../types/global";

export interface CheckboxButtonProps extends CheckboxProps {
  /** The main label displayed alongside the checkbox. */
  label: string;

  /** Additional description or subtext displayed below the label. */
  caption?: string;

  /** A small tag or badge displayed next to the label. */
  tag?: string;

  /** An optional icon displayed next to the label. */
  icon?: ReactElement;
}

export const CheckboxButton: React.FC<CheckboxButtonProps> = ({
  label,
  caption,
  tag,
  checked = false,
  disabled = false,
  size = Size.MEDIUM,
  icon,
  colorMode = ColorMode.LIGHT,
  theme = "themeA",
  ...props
}) => {
  return (
    <label
      className={classNames(
        "checkbox-button",
        `checkbox-button-${size}`,
        theme,
        colorMode,
        { disabled }
      )}
      data-theme={theme}
      data-color-mode={colorMode}
    >
      <div className={classNames("checkbox-button-container")}>
        <CheckboxInternal
          checked={checked}
          disabled={disabled}
          size={size}
          theme={theme}
          colorMode={colorMode}
          {...props}
        />

        <div className="checkbox-content">
          <div className="checkbox-label-caption-container">
            <span className="checkbox-label">{label}</span>
            {caption && <span className="checkbox-caption">{caption}</span>}
          </div>
          {tag && <span className="checkbox-tag">{tag}</span>}
        </div>
      </div>

      {icon && (
        <span
          className={classNames("icon", `${size}`)}
          data-testid="breadcrumb-icon"
        >
          {icon}
        </span>
      )}
    </label>
  );
};

export default CheckboxButton;
