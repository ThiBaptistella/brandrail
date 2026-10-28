import React, { ReactElement } from "react";
import classNames from "classnames";
import "./Breadcrumb.css";
import { ReactComponent as ChevronIcon } from "../../assets/iconset/chevron.svg";
import { ColorMode, Size } from "../../types/global";

export interface BreadcrumbItem {
  /** The text displayed for the breadcrumb item. */
  label?: string;

  /** The URL to navigate to when the breadcrumb item is clicked. */
  href?: string;

  /** Indicates whether the breadcrumb item represents the current page. */
  isCurrent?: boolean;

  /** Optional icon displayed alongside the breadcrumb item. */
  icon?: ReactElement;

  /** Function triggered when the breadcrumb item is clicked. */
  onClick?: () => void;
}

export interface BreadcrumbProps {
  /** An array of breadcrumb items to display. */
  items: BreadcrumbItem[];

  /** Defines whether the breadcrumb uses light or dark mode. */
  colorMode?: ColorMode;

  /** Applies theme variations to the breadcrumb. */
  theme?: string;

  /** Adjusts the breadcrumb size. */
  size?: Size;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  colorMode = ColorMode.LIGHT,
  theme = "themeA",
  size = Size.MEDIUM,
}) => {
  return (
    <nav
      className={classNames(
        "breadcrumb",
        theme,
        colorMode,
        `breadcrumb-${size}`
      )}
      aria-label="Breadcrumb"
      data-theme={theme}
      data-color-mode={colorMode}
    >
      <ol className="breadcrumb-list">
        {items.map((item, index) => (
          <li
            key={index}
            aria-current={item.isCurrent ? "page" : undefined}
            className={classNames(
              "breadcrumb-item",
              `breadcrumb-item-${size}`,
              { current: item.isCurrent }
            )}
          >
            {item.href ? (
              <a
                href={item.href}
                className={classNames(
                  "breadcrumb-link",
                  `breadcrumb-item-${size}`
                )}
                onClick={(e) => {
                  if (item.onClick) {
                    e.preventDefault();
                    item.onClick();
                  }
                }}
              >
                {item.icon && (
                  <span
                    className={classNames("icon", `${size}`)}
                    data-testid="breadcrumb-icon"
                  >
                    {item.icon}
                  </span>
                )}
                {item.label}
              </a>
            ) : (
              <span
                className={classNames(
                  "breadcrumb-text",
                  `breadcrumb-item-${size}`
                )}
              >
                {item.icon && (
                  <span
                    className={classNames("icon", `${size}`)}
                    data-testid="breadcrumb-icon"
                  >
                    {item.icon}
                  </span>
                )}
                {item.label}
              </span>
            )}
            {index < items.length - 1 && (
              <span
                className="breadcrumb-separator"
                data-testid="breadcrumb-icon"
              >
                <ChevronIcon />
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
