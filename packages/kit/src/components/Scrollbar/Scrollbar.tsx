import React, { useRef, useEffect, ReactNode } from "react";
import classNames from "classnames";
import "./Scrollbar.css";
import { Orientation, Size, ColorMode } from "../../types/global";

export interface ScrollbarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Defines the scroll direction: `vertical` for top-to-bottom, `horizontal` for side-scrolling. */
  orientation?: Orientation;

  /** Adjusts the size of the scrollbar. */
  size?: Size;

  /** Defines whether the scrollbar uses light or dark mode. */
  colorMode?: ColorMode;

  /** Applies theme variations to the scrollbar. */
  theme?: string;

  /** Content inside the scrollable area. */
  children: ReactNode;
}

const Scrollbar: React.FC<ScrollbarProps> = ({
  orientation = Orientation.VERTICAL,
  size = Size.MEDIUM,
  colorMode = ColorMode.LIGHT,
  theme = "themeA",
  className,
  children,
  ...props
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const handleWheel = (event: WheelEvent) => {
    if (!scrollRef.current) return;

    if (orientation === Orientation.HORIZONTAL) {
      scrollRef.current.scrollLeft += event.deltaY;
      event.preventDefault();
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el && orientation === Orientation.HORIZONTAL) {
      el.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      if (el && orientation === Orientation.HORIZONTAL) {
        el.removeEventListener("wheel", handleWheel);
      }
    };
  }, [orientation]);

  return (
    <div
      ref={scrollRef}
      role="region"
      aria-label="Custom Scrollbar"
      className={classNames(
        "scrollbar",
        `scrollbar-${orientation}`,
        `scrollbar-${size}`,
        theme,
        colorMode,
        className
      )}
      data-theme={theme}
      data-color-mode={colorMode}
      {...props}
    >
      <div className="scrollbar-content">{children}</div>
    </div>
  );
};

export default Scrollbar;
