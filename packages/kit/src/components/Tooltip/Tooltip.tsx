import React, { useState, useRef, useEffect } from "react";
import classNames from "classnames";
import "./Tooltip.css";
import { ColorMode } from "../../types/global";

export enum TooltipPosition {
  TOP_LEFT = "top-left",
  TOP_CENTER = "top-center",
  TOP_RIGHT = "top-right",
  BOTTOM_LEFT = "bottom-left",
  BOTTOM_CENTER = "bottom-center",
  BOTTOM_RIGHT = "bottom-right",
  LEFT = "left",
  RIGHT = "right",
}

export enum TooltipStyle {
  SIMPLE = "simple",
  DESCRIPTIVE = "descriptive",
  CHART = "chart",
}

export interface TooltipProps {
  /** The main content displayed inside the tooltip. */
  content?: string;

  /** Title for descriptive and chart tooltips. */
  title?: string;

  /** Style of tooltip (simple, descriptive, chart). */
  style?: TooltipStyle;

  /** Position of the tooltip relative to the element. */
  position?: TooltipPosition;

  /** Defines the color mode of the tooltip. */
  colorMode?: ColorMode;

  /** Defines the theme of the tooltip. */
  theme?: string;

  /** The element the tooltip wraps around. */
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  title,
  style = TooltipStyle.SIMPLE,
  position = TooltipPosition.TOP_CENTER,
  colorMode = ColorMode.LIGHT,
  theme = "themeA",
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible || !tooltipRef.current || !triggerRef.current) return;

    const tooltip = tooltipRef.current;
    const trigger = triggerRef.current;

    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const parentRect = trigger.offsetParent
      ? (trigger.offsetParent as HTMLElement).getBoundingClientRect()
      : { left: 0, top: 0 };

    const extraOffset = style === TooltipStyle.CHART ? 20 : 8;

    const positions: Record<TooltipPosition, { left: number; top: number }> = {
      [TooltipPosition.TOP_LEFT]: {
        left: triggerRect.left - tooltipRect.width * (4 / 5) - parentRect.left,
        top:
          triggerRect.top - tooltipRect.height - extraOffset - parentRect.top,
      },
      [TooltipPosition.TOP_CENTER]: {
        left:
          triggerRect.left +
          triggerRect.width / 2 -
          tooltipRect.width / 2 -
          parentRect.left,
        top:
          triggerRect.top - tooltipRect.height - extraOffset - parentRect.top,
      },
      [TooltipPosition.TOP_RIGHT]: {
        left: triggerRect.right - tooltipRect.width * (1 / 5) - parentRect.left,
        top:
          triggerRect.top - tooltipRect.height - extraOffset - parentRect.top,
      },
      [TooltipPosition.BOTTOM_LEFT]: {
        left: triggerRect.left - tooltipRect.width * (4 / 5) - parentRect.left,
        top: triggerRect.bottom + extraOffset - parentRect.top,
      },
      [TooltipPosition.BOTTOM_CENTER]: {
        left:
          triggerRect.left +
          triggerRect.width / 2 -
          tooltipRect.width / 2 -
          parentRect.left,
        top: triggerRect.bottom + extraOffset - parentRect.top,
      },
      [TooltipPosition.BOTTOM_RIGHT]: {
        left: triggerRect.right - tooltipRect.width * (1 / 5) - parentRect.left,
        top: triggerRect.bottom + extraOffset - parentRect.top,
      },
      [TooltipPosition.LEFT]: {
        left:
          triggerRect.left - tooltipRect.width - extraOffset - parentRect.left,
        top:
          triggerRect.top +
          triggerRect.height / 2 -
          tooltipRect.height / 2 -
          parentRect.top,
      },
      [TooltipPosition.RIGHT]: {
        left: triggerRect.right + extraOffset - parentRect.left,
        top:
          triggerRect.top +
          triggerRect.height / 2 -
          tooltipRect.height / 2 -
          parentRect.top,
      },
    };

    const newPos = positions[position];
    tooltip.style.left = `${newPos.left}px`;
    tooltip.style.top = `${newPos.top}px`;
  }, [visible, position, style]);

  return (
    <div
      className={classNames("tooltip-container", colorMode, theme)}
      data-theme={theme}
      data-color-mode={colorMode}
    >
      <div
        ref={triggerRef}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        {children}
      </div>
      {visible && (
        <div
          ref={tooltipRef}
          className={classNames(
            "tooltip",
            `tooltip-${style}`,
            `tooltip-${position}`,
            "tooltip-visible",
            colorMode,
            theme
          )}
        >
          {(style === TooltipStyle.DESCRIPTIVE ||
            style === TooltipStyle.CHART) &&
            title && (
              <span className="tooltip-title" data-testid="tooltip-title">
                {title}
              </span>
            )}
          <span className="tooltip-content">{content}</span>
          {style === TooltipStyle.CHART ? (
            <div
              className={classNames(
                "tooltip-arrow-chart",
                `tooltip-arrow-${position}`
              )}
            />
          ) : (
            <div
              className={classNames(
                "tooltip-arrow",
                `tooltip-arrow-${position}`
              )}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
