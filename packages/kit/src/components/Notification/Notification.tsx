import React, { ReactElement } from "react";
import classNames from "classnames";
import "./Notification.css";
import { ReactComponent as CrossIcon } from "../../assets/iconset/cross.svg";
import { ReactComponent as InfoIcon } from "../../assets/iconset/info-solid.svg";
import { ReactComponent as CheckIcon } from "../../assets/iconset/check-solid.svg";
import { ReactComponent as ExclamationIcon } from "../../assets/iconset/exclamation-solid.svg";
import { ReactComponent as QuestionIcon } from "../../assets/iconset/question-mark-solid.svg";
import { Size, ColorMode } from "../../types/global";

export enum NotificationType {
  INFO = "info",
  SUCCESS = "success",
  WARNING = "warning",
  ERROR = "error",
}

export interface NotificationProps {
  /** The title displayed in the notification. */
  title?: string;

  /** The message content inside the notification. */
  message?: string;

  /** The optional icon displayed alongside the notification. */
  icon?: ReactElement;

  /** Adjusts the size of the notification. */
  size?: Size;

  /** Determines the type of notification (e.g., info, success, warning, error). */
  type?: NotificationType;

  /** Toggles between light and dark mode. */
  colorMode?: ColorMode;

  /** Selects the theme variant for styling. */
  theme?: string;

  /** Function triggered when the close button is clicked. */
  onClose?: () => void;
}

const Notification: React.FC<NotificationProps> = ({
  title,
  message,
  icon,
  size = Size.MEDIUM,
  type = NotificationType.INFO,
  colorMode = ColorMode.LIGHT,
  theme = "themeA",
  onClose,
}) => {
  // Default icons based on type
  const getDefaultIcon = () => {
    switch (type) {
      case NotificationType.SUCCESS:
        return <CheckIcon />;
      case NotificationType.WARNING:
        return <QuestionIcon />;
      case NotificationType.ERROR:
        return <ExclamationIcon />;
      case NotificationType.INFO:
      default:
        return <InfoIcon />;
    }
  };

  return (
    <div
      className={classNames("notification", size, theme, colorMode)}
      data-theme={theme}
      data-color-mode={colorMode}
      data-testid="notification-container"
    >
      <div
        className={classNames("notification-content", size)}
        data-testid="notification-content"
      >
        <span className="notification-icon" data-testid="notification-icon">
          {icon ?? getDefaultIcon()}
        </span>
        <div className="notification-text">
          <strong>{title}</strong>
          {message && <p>{message}</p>}
        </div>
      </div>
      {onClose && (
        <button
          className="notification-close"
          onClick={onClose}
          aria-label="Close notification"
          data-testid="notification-close"
        >
          <CrossIcon />
        </button>
      )}
    </div>
  );
};

export default Notification;
