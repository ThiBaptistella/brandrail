import React from "react";
import classNames from "classnames";
import { Avatar, AvatarProps } from "./Avatar";
import { ColorMode } from "../../types/global";
import "./AvatarGroup.css";

export interface AvatarGroupProps {
  /** List of avatars to display in a grouped layout. */
  avatars: AvatarProps[];

  /** Maximum number of avatars to display before truncating. */
  maxDisplay?: number;

  /** Defines whether the avatar group uses light or dark mode. */
  colorMode?: ColorMode;

  /** Theme variation for styling the avatar group. */
  theme?: string;
}

const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  maxDisplay,
  colorMode = ColorMode.LIGHT,
  theme = "themeA",
}) => {
  const displayedAvatars = maxDisplay ? avatars.slice(0, maxDisplay) : avatars;

  return (
    <div
      className={classNames("avatarGroup", theme, colorMode)}
      data-theme={theme}
      data-color-mode={colorMode}
    >
      {displayedAvatars.map((avatar, index) => (
        <Avatar key={index} {...avatar} theme={theme} colorMode={colorMode} />
      ))}
    </div>
  );
};

export default AvatarGroup;
