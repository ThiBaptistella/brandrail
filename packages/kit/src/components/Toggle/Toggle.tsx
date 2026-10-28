import React, { ReactElement } from "react";
import classNames from "classnames";
import ToggleInternal, { ToggleProps } from "./ToggleInternal";
import "./Toggle.css";
import { Align, ColorMode } from "../../types/global";

export interface ToggleLabelProps extends ToggleProps {
  /** The text label displayed alongside the toggle switch. */
  label: string;

  /** Determines the position of the label relative to the toggle. */
  labelPosition?: Align;

  /** Adds an icon before the toggle switch. */
  iconLeft?: ReactElement;

  /** Adds an icon after the toggle switch. */
  iconRight?: ReactElement;
}

const Toggle: React.FC<ToggleLabelProps> = ({
  label,
  labelPosition = Align.RIGHT,
  colorMode = ColorMode.LIGHT,
  theme = "themeA",
  iconLeft,
  iconRight,
  ...props
}) => {
  return (
    <div
      data-testid="toggle-label-wrapper"
      className={classNames("toggle-label-container", theme, colorMode)}
      data-theme={theme}
      data-color-mode={colorMode}
    >
      {iconLeft && (
        <span className="toggle-icon" data-testid="toggle-icon">
          {iconLeft}
        </span>
      )}
      <div
        className={classNames("toggle-label", `toggle-label-${labelPosition}`)}
      >
        <ToggleInternal {...props} />
        {label && <span className="toggle-label-text">{label}</span>}
      </div>

      {iconRight && (
        <span className="toggle-icon" data-testid="toggle-icon">
          {iconRight}
        </span>
      )}
    </div>
  );
};

export default Toggle;
