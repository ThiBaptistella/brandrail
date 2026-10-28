import React, { ReactElement, useMemo } from "react";
import classNames from "classnames";
import "./Caption.css";
import { Size, ColorMode } from "../../types/global";

export enum CaptionType {
  TEXT = "text",
  GAUGE = "gauge",
}

export enum CaptionStatus {
  INFO = "info",
  SUCCESS = "success",
  ERROR = "error",
  WARNING = "warning",
}

export interface CaptionProps {
  /** The text displayed inside the caption. */
  text?: string;

  /** Determines the visual type of the caption. */
  type?: CaptionType;

  /** Defines the status of the caption. */
  status?: CaptionStatus;

  /** Represents a percentage value for strength indicators. */
  strength?: number; // Strength percentage (0-100)

  /** Adjusts the size of the caption. */
  size?: Size;

  /** Defines whether the caption uses light or dark mode. */
  colorMode?: ColorMode;

  /** Applies theme variations. */
  theme?: string;

  /** Adds an optional icon inside the caption. */
  icon?: ReactElement;
}

const Caption: React.FC<CaptionProps> = ({
  text,
  status = CaptionStatus.INFO,
  strength = 10,
  colorMode = ColorMode.LIGHT,
  theme = "themeA",
  size = Size.MEDIUM,
  icon,
  type = CaptionType.TEXT,
}) => {
  return (
    <div
      className={classNames("caption-container", theme, colorMode)}
      data-theme={theme}
      data-color-mode={colorMode}
    >
      {/* Text Caption */}
      {type === CaptionType.TEXT && (
        <div className="caption-content">
          {icon && (
            <span className={classNames("icon", `caption-${status}`, size)}>
              {icon}
            </span>
          )}
          <span className={classNames("caption", `caption-${status}`, size)}>
            {text}
          </span>
        </div>
      )}

      {/* Strength Progress Bar */}
      {type === CaptionType.GAUGE && typeof strength === "number" && (
        <div className="strength-bar-container">
          <div className="strength-bar">
            {[0, 20, 40, 60, 80].map((threshold) => (
              <span
                key={threshold}
                className={classNames("strength-segment", size, {
                  filled: strength >= threshold,
                  [`strength-${status}`]: true,
                })}
              />
            ))}
          </div>
          {text && (
            <span className={classNames("caption", `caption-${status}`, size)}>
              {text}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Caption;
