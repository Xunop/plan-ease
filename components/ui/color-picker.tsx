"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const DEFAULT_COLORS = [
  "#FF6B6B",
  "#FFD93D",
  "#6BCB77",
  "#4D96FF", // Vibrant
  "#F7C8E0",
  "#B1AFFF",
  "#a0e9ff",
  "#95BDFF", // Pastel
  "#F0F0F0",
  "#D9D9D9",
  "#BFBFBF",
  "#A6A6A6", // Grays
  "#737373",
  "#595959",
  "#404040",
  "#000000", // Darker
  "#ffffff", // White (add a border for visibility)
];

export const RAINBOW_COLORS = [
  "#FF0000", // Red
  "#FFA500", // Orange
  "#FFFF00", // Yellow
  "#00FF00", // Lime Green
  "#00FFFF", // Cyan
  "#0000FF", // Blue
  "#800080", // Purple
  "#FF00FF", // Magenta
];

const HEX_COLOR_REGEX = /^#?([0-9A-Fa-f]{6})$/;

export const isValidHexColor = (color: string): boolean => HEX_COLOR_REGEX.test(color);

// Function to format color to #RRGGBB
export const formatHex = (color: string): string => {
  const match = color.match(HEX_COLOR_REGEX);
  if (!match) return ""; // Or return a default/error state
  return `#${match[1].toUpperCase()}`;
};

export interface ColorPickerProps {
  /** The currently selected color value (format: #RRGGBB). */
  value?: string;
  /** Callback function triggered when a color is selected or input. */
  onChange?: (color: string) => void;
  /** Array of color strings (#RRGGBB) for swatches. @default DEFAULT_COLORS */
  colors?: string[];
  /** Additional class names for the root element. */
  className?: string;
}

function ColorPicker({
  value, // Expecting #RRGGBB format
  onChange,
  colors = DEFAULT_COLORS,
  className,
}: ColorPickerProps) {
  // Input state stores the hex value *without* the '#' prefix
  const [inputValue, setInputValue] = React.useState(() =>
    value && isValidHexColor(value) ? value.substring(1).toUpperCase() : "",
  );
  const [isValidInput, setIsValidInput] = React.useState(
    () => (value ? isValidHexColor(value) : true), // Assume initial value is valid or input is empty
  );

  // Derived selected color based on the controlled value prop
  const selectedColor =
    value && isValidHexColor(value) ? formatHex(value) : undefined;

  // Effect to update input field if the external value prop changes
  React.useEffect(() => {
    if (value && isValidHexColor(value)) {
      const formatted = formatHex(value);
      // Only update input if it differs from the current external value
      if (formatted !== `#${inputValue}`) {
        setInputValue(formatted.substring(1).toUpperCase());
        setIsValidInput(true);
      }
    } else if (value === undefined || value === "") {
      // Allow clearing the input if value is explicitly cleared externally
      setInputValue("");
      setIsValidInput(true); // Empty is considered valid state for input itself
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.toUpperCase();
    setInputValue(rawValue); // Update input state immediately for responsiveness

    const fullHex = `#${rawValue}`;
    if (isValidHexColor(fullHex)) {
      setIsValidInput(true);
      // Only trigger onChange if the valid color is different from the current prop value
      if (fullHex !== selectedColor) {
        onChange?.(fullHex);
      }
    } else {
      setIsValidInput(false);
      // Optional: Decide if you want to call onChange with an invalid state, '' or undefined
      // If the input is completely empty, consider it valid input state but no color selected
      if (rawValue === "") {
        setIsValidInput(true);
        if (selectedColor !== undefined) {
          // Only trigger if clearing a previously valid color
          onChange?.(""); // Or onChange?.(undefined); depending on desired behavior
        }
      }
    }
  };

  const handleSwatchClick = (color: string) => {
    const formattedColor = formatHex(color);
    setInputValue(formattedColor.substring(1).toUpperCase()); // Update input field
    setIsValidInput(true);
    if (formattedColor !== selectedColor) {
      onChange?.(formattedColor); // Trigger parent update
    }
  };

  // Color for the preview swatch - use valid selected color, fallback to transparent
  const previewColor =
    selectedColor && isValidInput ? selectedColor : "transparent";
  // Add border to preview if the color is white or transparent
  const previewNeedsBorder =
    previewColor === "#FFFFFF" || previewColor === "transparent";

  return (
    <div
      className={cn(
        "p-3 bg-white rounded-lg shadow-lg border border-gray-200/75 w-[220px]",
        className,
      )}
    >
      {/* Top Section: Preview + Hex Input */}
      <div className="flex items-center gap-2.5 mb-3">
        {/* Color Preview */}
        <div
          className={cn(
            "w-6 h-6 rounded-md flex-shrink-0 border",
            previewNeedsBorder ? "border-gray-300" : "border-transparent",
          )}
          style={{ backgroundColor: previewColor }}
        />
        {/* Hex Input Field */}
        <div className="flex items-center border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-offset-1 focus-within:ring-gray-400 focus-within:border-gray-400 flex-grow transition-colors duration-150">
          <span className="pl-2 text-sm text-gray-500 select-none">#</span>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            maxLength={6}
            className={cn(
              "w-full px-1 py-0.5 text-sm outline-none border-none bg-transparent font-mono", // Monospaced font for hex
              !isValidInput && inputValue.length > 0
                ? "text-red-600"
                : "text-gray-800", // Indicate invalid input
            )}
            aria-label="Hex color code (6 digits)"
            spellCheck="false"
            placeholder="RRGGBB"
          />
        </div>
      </div>

      {/* Divider - Optional */}
      {/* <hr className="my-2 border-gray-100"/> */}

      {/* Bottom Section: Color Swatches Grid */}
      <div className="grid grid-cols-8 gap-1">
        {" "}
        {/* Adjusted grid columns */}
        {colors.map((color) => {
          const formattedSwatchColor = formatHex(color);
          if (!formattedSwatchColor) return null; // Skip invalid colors in the definition array

          const isSelected = selectedColor === formattedSwatchColor;
          const isLight = isColorLight(formattedSwatchColor); // Reuse helper from previous version
          const needsBorder = formattedSwatchColor === "#FFFFFF";

          return (
            <button
              key={formattedSwatchColor}
              type="button"
              onClick={() => handleSwatchClick(formattedSwatchColor)}
              className={cn(
                "h-6 w-6 rounded border flex items-center justify-center transition-transform duration-100 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary",
                isSelected
                  ? "ring-2 ring-offset-1 ring-primary scale-110"
                  : "ring-0", // Selection indication
                needsBorder ? "border-gray-400" : "border-transparent", // Border for white swatch
              )}
              style={{ backgroundColor: formattedSwatchColor }}
              aria-label={`Select color ${formattedSwatchColor}`}
              aria-pressed={isSelected}
            >
              {isSelected && (
                <Check
                  className={cn(
                    "h-3.5 w-3.5", // Slightly smaller check
                    isLight ? "text-black" : "text-white",
                  )}
                  strokeWidth={3}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

ColorPicker.displayName = "ColorPicker";

// Helper function
function isColorLight(hexColor: string): boolean {
  try {
    const color = hexColor.startsWith("#") ? hexColor.substring(1) : hexColor;
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 150;
  } catch (e) {
    return true; // Assume light on error
  }
}

export { ColorPicker };
