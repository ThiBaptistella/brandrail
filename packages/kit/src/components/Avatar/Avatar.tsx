import React from "react";
import classNames from "classnames";
import "./Avatar.css";
import { Size, ColorMode } from "../../types/global";

export enum AvatarState {
  DEFAULT = "default",
  ONLINE = "online",
  AWAY = "away",
  BUSY = "busy",
  OFFLINE = "offline",
}

export interface AvatarProps {
  /** URL of the avatar image. If not provided, initials will be displayed. */
  src?: string;

  /** Alternative text for the avatar image, used for accessibility. */
  alt?: string;

  /** The initials to display if no image is provided. Should be 2 characters. */
  initials: string;

  /** Size of the avatar (small, medium, large). */
  size?: Size;

  /** The current state of the avatar, representing user presence. */
  state?: AvatarState;

  /** Theme variation for styling the avatar. */
  theme?: string;

  /** Defines whether the avatar uses light or dark mode. */
  colorMode?: ColorMode;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = "User Avatar",
  initials,
  size = Size.MEDIUM,
  state = AvatarState.DEFAULT,
  colorMode = ColorMode.LIGHT,
  theme = "themeA",
}) => {
  return (
    <div
      className={classNames(
        "avatarContainer",
        `avatar-${size}`,
        theme,
        colorMode
      )}
      data-theme={theme}
      data-color-mode={colorMode}
    >
      {src ? (
        <div className={classNames(`image-${size}`)}>
          <img src={src} alt={alt} className={classNames("avatarImage")} />
        </div>
      ) : (
        <span className="avatarInitials">{initials?.substring(0, 2)}</span>
      )}
      {state !== AvatarState.DEFAULT && (
        <span
          className={classNames(
            "avatarStatus",
            `status-${state}`,
            `status-${size}`
          )}
        />
      )}
    </div>
  );
};

export default Avatar;
