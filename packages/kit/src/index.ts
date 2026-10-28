"use client";

/**
 * @brandrail/kit — the Midrocks UI kit components, unchanged from default-ui-kit/src.
 * Every component takes `theme` and `colorMode` props; use theme="brandrail" for the GitHub-style look.
 * Import "@brandrail/kit/styles.css" once in the app.
 */
export { default as Avatar } from "./components/Avatar/Avatar";
export { default as AvatarLabel } from "./components/Avatar/AvatarLabel";
export { default as AvatarGroup } from "./components/Avatar/AvatarGroup";
export { default as Breadcrumb } from "./components/Breadcrumb/Breadcrumb";
export { default as Button, ButtonType } from "./components/Button/Button";
export { default as ButtonGroup } from "./components/ButtonGroup/ButtonGroup";
export { default as Checkbox } from "./components/Checkbox/Checkbox";
export { default as CheckboxButton } from "./components/Checkbox/CheckboxButton";
export { default as CheckboxGroup } from "./components/CheckboxGroup/CheckboxGroup";
export { default as DatePicker } from "./components/DatePicker/DatePicker";
export { default as Calendar } from "./components/DatePicker/Calendar";
export { default as Divider } from "./components/Divider/Divider";
export { default as Dropdown } from "./components/Dropdown/Dropdown";
export { default as List } from "./components/Dropdown/List";
export { default as ListItem } from "./components/Dropdown/ListItem";
export { default as InputText } from "./components/InputText/InputText";
export { default as InputTextArea } from "./components/InputText/InputTextArea";
export { default as Caption } from "./components/InputText/Caption";
export { default as Loader } from "./components/Loader/Loader";
export { default as Notification } from "./components/Notification/Notification";
export { default as ProgressBar } from "./components/ProgressBar/ProgressBar";
export { default as RadioButton } from "./components/Radio/RadioButton";
export { default as Radio } from "./components/Radio/Radio";
export { default as RadioGroup } from "./components/RadioGroup/RadioGroup";
export { default as Scrollbar } from "./components/Scrollbar/Scrollbar";
export { default as Toggle } from "./components/Toggle/Toggle";
export { default as Tooltip } from "./components/Tooltip/Tooltip";
export { default as VideoPlayer } from "./components/VideoPlayer/VideoPlayer";

export { Size, ColorMode, Align, Orientation, Layout, State } from "./types/global";
export { NotificationType } from "./components/Notification/Notification";
export { AvatarState } from "./components/Avatar/Avatar";
export { TooltipPosition, TooltipStyle } from "./components/Tooltip/Tooltip";
export { InputTextType } from "./components/InputText/InputText";

/** Themes shipped with the kit. */
export const KIT_THEMES = ["brandrail", "themeA", "themeB"] as const;
export type KitTheme = (typeof KIT_THEMES)[number];
