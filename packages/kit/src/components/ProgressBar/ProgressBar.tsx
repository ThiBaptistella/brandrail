import React from "react";
import classNames from "classnames";
import "./ProgressBar.css";
import { Size, ColorMode, Align } from "../../types/global";

export interface ProgressBarProps {
  /** The current progress value as a percentage (0-100). */
  value: number;

  /** Adjusts the size of the progress bar. */
  size?: Size;

  /** Determines where the progress label is displayed. */
  labelPosition?: Align;

  /** Toggles between light and dark mode. */
  colorMode?: ColorMode;

  /** Applies theme variations. */
  theme?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  size = Size.MEDIUM,
  labelPosition = Align.RIGHT,
  colorMode = ColorMode.LIGHT,
  theme = "themeA",
}) => {
  const clampedValue = Math.max(0, Math.min(100, value));
  return (
    <div
      className={classNames(
        "progress-bar",
        labelPosition,
        size,
        theme,
        colorMode
      )}
      data-theme={theme}
      data-color-mode={colorMode}
      data-testid="progress-bar"
    >
      {labelPosition === "top" && (
        <span className={classNames("progress-label", size)}>
          {clampedValue}%
        </span>
      )}
      <div className="progress-container">
        <div className="progress-background"></div>
        <div
          role="progressbar"
          data-testid="progress-fill"
          className="progress-fill"
          style={{ width: `${clampedValue}%` }}
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
        ></div>
      </div>
      {labelPosition === "right" && (
        <span className={classNames("progress-label", size)}>
          {clampedValue}%
        </span>
      )}
      {labelPosition === "bottom" && (
        <span className={classNames("progress-label", size)}>
          {clampedValue}%
        </span>
      )}
    </div>
  );
};

export default ProgressBar;
