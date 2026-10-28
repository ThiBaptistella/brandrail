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
import "./CheckboxGroup.css";
import { CheckboxLabelProps } from "../Checkbox/Checkbox";
import { ColorMode, Size, Layout } from "../../types/global";

export interface CheckboxGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** One or multiple `CheckboxLabel` components. Ensures type safety. */
  children:
    | ReactElement<CheckboxLabelProps>
    | ReactElement<CheckboxLabelProps>[];

  /** Defines the layout direction of the checkbox group. */
  layout?: Layout;

  /** Disables all checkboxes in the group. */
  disabled?: boolean;

  /** Controls the size of the checkboxes within the group. */
  size?: Size;

  /** Applies theme variations. */
  theme?: string;

  /** Defines whether the component uses light or dark mode. */
  colorMode?: ColorMode;

  /** The title displayed at the top of the checkbox group. */
  title?: string;

  /** A brief description under the title. */
  caption?: string;

  /** Callback function triggered when the selection changes. */
  onChange?: (selectedValues: string[]) => void;
}

export const CheckboxGroup = forwardRef<HTMLDivElement, CheckboxGroupProps>(
  (
    {
      children,
      disabled = false,
      layout = "row",
      size = Size.MEDIUM,
      colorMode = ColorMode.LIGHT,
      theme = "themeA",
      title,
      caption,
      onChange,
    },
    ref
  ) => {
    const internalRef = useRef<HTMLDivElement>(null);

    // Extract checkbox values from children
    const initialCheckedValues = Children.toArray(children)
      .filter(isValidElement<CheckboxLabelProps>)
      .filter(
        (child) => child.props.checked && typeof child.props.label === "string"
      )
      .map((child) => child.props.label as string);

    const [selectedValues, setSelectedValues] =
      useState<string[]>(initialCheckedValues);

    const handleCheckboxChange = (label: string, checked: boolean) => {
      const updatedValues = checked
        ? [...selectedValues, label]
        : selectedValues.filter((value) => value !== label);

      setSelectedValues(updatedValues);
      if (onChange) onChange(updatedValues);
    };

    return (
      <div
        ref={ref || internalRef}
        className={classNames(
          "checkbox-group",
          `checkbox-group-${layout}`,
          `checkbox-group-${size}`,
          theme,
          colorMode
        )}
        role="group"
        data-theme={theme}
        data-color-mode={colorMode}
      >
        {(title || caption) && (
          <div
            className={classNames(
              "checkbox-group-header",
              `checkbox-group-header-${size}`
            )}
          >
            {title && <span className="checkbox-group-title">{title}</span>}
            {caption && (
              <span className="checkbox-group-caption">{caption}</span>
            )}
          </div>
        )}

        <div
          className={classNames(
            "checkbox-group-item-container",
            `checkbox-group-item-container-${size}`,
            `checkbox-group-item-container-${layout}`
          )}
        >
          {Children.map(children, (child) => {
            const label = child.props.label;
            if (!label) return null;

            return cloneElement(child, {
              ...child.props,
              disabled: disabled || child.props.disabled,
              size,
              theme,
              colorMode,
              checked: selectedValues.includes(label),
              onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                handleCheckboxChange(label, e.target.checked),
            } as CheckboxLabelProps);
          })}
        </div>
      </div>
    );
  }
);

export default CheckboxGroup;
