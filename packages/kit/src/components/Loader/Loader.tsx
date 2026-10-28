import React, { useMemo } from "react";
import classNames from "classnames";
import "./Loader.css";
import { ColorMode } from "../../types/global";

export interface LoaderProps {
  /** Optional text displayed below the loader. */
  caption?: string;

  /** Determines the color mode of the loader. */
  colorMode?: ColorMode;

  /** Applies theme variations to the loader. */
  theme?: string;
}

const Loader: React.FC<LoaderProps> = ({
  caption,
  colorMode = ColorMode.LIGHT,
  theme = "themeA",
}) => {
  // Memoized classes for performance optimization
  const loaderClass = useMemo(
    () => classNames("loader", theme, colorMode),
    [theme, colorMode]
  );

  return (
    <div
      className="loader-container"
      data-theme={theme}
      data-color-mode={colorMode}
    >
      <div className={loaderClass} aria-busy="true" role="alert">
        <div className="loader-spinner" />
      </div>
      {caption && <span className="loader-caption">{caption}</span>}
    </div>
  );
};

const MemoizedLoader = React.memo(Loader);
MemoizedLoader.displayName = "Loader";
export default MemoizedLoader;
