import React, {
  forwardRef,
  ReactElement,
  useEffect,
  useRef,
  Children,
  isValidElement,
  cloneElement,
  useState,
} from "react";
import classNames from "classnames";
import "./RadioGroup.css";
import { RadioLabelProps } from "../Radio/Radio";
import { Layout, Size, ColorMode } from "../../types/global";

export interface RadioGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Defines the child radio labels (only accepts `Radio` components). */
  children: ReactElement<RadioLabelProps> | ReactElement<RadioLabelProps>[];

  /** Defines the arrangement of radio buttons within the group. */
  layout?: Layout;

  /** Disables all radio buttons in the group. */
  disabled?: boolean;

  /** Adjusts the size of the radio buttons in the group. */
  size?: Size;

  /** Defines whether the group uses light or dark mode. */
  colorMode?: ColorMode;

  /** Applies theme variations to the group. */
  theme?: string;

  /** The title displayed above the radio group. */
  title?: string;

  /** A caption providing additional information about the radio group. */
  caption?: string;

  /** Callback function triggered when a radio button is selected. */
  onChange?: (selectedValue: string) => void;
}

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      children,
      disabled = false,
      size = Size.MEDIUM,
      layout = Layout.ROW,
      colorMode = ColorMode.LIGHT,
      theme = "themeA",
      title,
      caption,
      onChange,
      ...props
    },
    ref
  ) => {
    const internalRef = useRef<HTMLDivElement>(null);

    // Extract selected value from children
    const initialCheckedValue =
      (Children.toArray(children)
        .filter(isValidElement<RadioLabelProps>)
        .find(
          (child) =>
            child.props.checked && typeof child.props.label === "string"
        )?.props.label as string) || "";

    const [selectedValue, setSelectedValue] =
      useState<string>(initialCheckedValue);

    const handleRadioChange = (label: string) => {
      setSelectedValue(label);
      if (onChange) onChange(label);
    };

    return (
      <div
        ref={ref || internalRef}
        className={classNames(
          "radio-group",
          `radio-group-${layout}`,
          `radio-group-${size}`,
          theme,
          colorMode
        )}
        role="radiogroup"
        data-theme={theme}
        data-color-mode={colorMode}
        {...props}
      >
        {(title || caption) && (
          <div
            className={classNames(
              "radio-group-header",
              `radio-group-header-${size}`
            )}
          >
            {title && <span className="radio-group-title">{title}</span>}
            {caption && <span className="radio-group-caption">{caption}</span>}
          </div>
        )}

        <div
          className={classNames(
            "radio-group-item-container",
            `radio-group-item-container-${size}`,
            `radio-group-item-container-${layout}`
          )}
        >
          {Children.map(children, (child, index) => {
            return cloneElement(child, {
              ...child.props,
              disabled: disabled || child.props.disabled,
              size,
              theme,
              colorMode,
              checked: selectedValue === child.props.label,
              onChange: () => {
                if (typeof child.props.label === "string") {
                  handleRadioChange(child.props.label);
                }
              },
            });
          })}
        </div>
      </div>
    );
  }
);

export default RadioGroup;
