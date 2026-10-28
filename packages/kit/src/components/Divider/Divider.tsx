import React from "react";
import classNames from "classnames";
import "./Divider.css";
import { Align, ColorMode, Orientation } from "../../types/global";

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional label to be displayed within the divider. */
  label?: string;

  /** Defines the orientation of the divider (horizontal or vertical). */
  orientation?: Orientation;

  /** Defines whether the divider uses light or dark mode. */
  colorMode?: ColorMode;

  /** Applies theme variations. */
  theme?: string;

  /** Aligns the label within the divider. */
  labelAlignment?: Align;
}

export const Divider: React.FC<DividerProps> = ({
  label,
  theme = "themeA",
  orientation = Orientation.HORIZONTAL,
  colorMode = ColorMode.LIGHT,
  labelAlignment = Align.CENTER,
}) => {
  return (
    <div
      data-testid="divider"
      className={classNames(
        "divider",
        `divider-${orientation}`,
        theme,
        colorMode,
        {
          "divider-labeled": label,
        }
      )}
      data-theme={theme}
      data-color-mode={colorMode}
    >
      {label ? (
        <div
          className={classNames(
            "divider-with-label",
            `divider-${labelAlignment}`,
            `divider-${orientation}`
          )}
        >
          {labelAlignment !== "right" && (
            <hr className="divider-line" data-testid="divider-line" />
          )}
          <span className="divider-label" data-testid="divider-label">
            {label}
          </span>
          {labelAlignment !== "left" && (
            <hr className="divider-line" data-testid="divider-line" />
          )}
        </div>
      ) : (
        <hr className="divider-line full" data-testid="divider-line-full" />
      )}
    </div>
  );
};

export default Divider;
