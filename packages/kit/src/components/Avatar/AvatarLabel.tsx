import React, { ReactElement } from "react";
import classNames from "classnames";
import { Avatar, AvatarProps } from "./Avatar";
import { ColorMode } from "../../types/global";
import "./AvatarLabel.css";

export interface AvatarLabelProps extends AvatarProps {
  /** The full name associated with the avatar. */
  name: string;

  /** Additional caption or role displayed below the name. */
  caption?: string;

  /** If true, reverses the avatar and label position. */
  reverse?: boolean;

  /** Optional icon displayed alongside the avatar label. */
  icon?: ReactElement;

  /** Theme variation for styling the avatar label. */
  theme?: string;

  /** Defines whether the avatar label uses light or dark mode. */
  colorMode?: ColorMode;
}

export const AvatarLabel: React.FC<AvatarLabelProps> = ({
  name,
  caption,
  reverse = false,
  icon,
  colorMode = ColorMode.LIGHT,
  theme = "themeA",
  ...avatarProps
}) => {
  return (
    <div
      className={classNames(
        "avatarLabelContainer",
        theme,
        colorMode,
        reverse ? "reverse" : ""
      )}
      data-theme={theme}
      data-color-mode={colorMode}
      role="presentation"
      data-testid="avatar-label"
    >
      <Avatar {...avatarProps} />
      <div
        className={classNames("avatarText", `text-${avatarProps.size}`)}
        data-testid="avatar-text"
      >
        <span className="avatarName">{name}</span>
        {caption && <span className="avatarCaption">{caption}</span>}
      </div>
      {icon && (
        <div
          className={classNames("icon", `${avatarProps.size}`)}
          data-testid="breadcrumb-icon"
        >
          {icon}
        </div>
      )}
    </div>
  );
};

export default AvatarLabel;
