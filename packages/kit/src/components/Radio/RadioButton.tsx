import React, { ReactElement } from "react";
import classNames from "classnames";
import "./RadioButton.css";
import RadioInternal, { RadioProps } from "./RadioInternal";
import { Size, ColorMode } from "../../types/global";

export interface RadioButtonProps extends RadioProps {
  /** The main label of the radio button. */
  label: string;

  /** Optional caption text beneath the label. */
  caption?: string;

  /** A tag label (e.g., status or category) displayed next to the radio button. */
  tag?: string;

  /** Adds an optional icon to the radio button. */
  icon?: ReactElement;
}

export const RadioButton: React.FC<RadioButtonProps> = ({
  label,
  caption,
  tag,
  checked = false,
  disabled = false,
  icon,
  size = Size.MEDIUM,
  colorMode = ColorMode.LIGHT,
  theme = "themeA",
  ...props
}) => {
  return (
    <label
      className={classNames(
        "radio-button",
        `radio-button-${size}`,
        theme,
        colorMode,
        { disabled }
      )}
      data-theme={theme}
      data-color-mode={colorMode}
    >
      <div className={classNames("radio-button-container")}>
        <RadioInternal
          checked={checked}
          disabled={disabled}
          size={size as Size}
          theme={theme}
          colorMode={colorMode as ColorMode}
          {...props}
        />
        <div className="radio-content">
          <div className="radio-label-caption-container">
            <span className="radio-label">{label}</span>
            {caption && <span className="radio-caption">{caption}</span>}
          </div>
          {tag && <span className="radio-tag">{tag}</span>}
        </div>
      </div>

      {icon && (
        <span
          className={classNames("icon", `${size}`)}
          data-testid="radio-icon"
        >
          {icon}
        </span>
      )}
    </label>
  );
};

export default RadioButton;
