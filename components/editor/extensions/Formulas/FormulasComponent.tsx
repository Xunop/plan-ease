import React from "react";
import { NodeViewWrapper, NodeViewContent, NodeViewProps } from "@tiptap/react";
import { FormulasAttributes } from "./types"; // Adjust path
import "./formulas.scss";

const FormulasComponent: React.FC<NodeViewProps> = ({ node, editor }) => {
  // Cast attributes to the specific type for type safety
  const attrs = node.attrs as FormulasAttributes;
  const {
    commandName,
    displayOptions,
    resultData,
    resultDisplay,
    status,
    errorMessage,
  } = attrs;

  const renderWeatherResult = () => {
    // Prefer structured data if available
    if (resultData?.forecast && resultData?.city) {
      const forecast = resultData.forecast;
      const city = displayOptions?.address ?? resultData.city; // Use display name if possible
      const date = displayOptions?.date ?? forecast.date; // Use display date if possible
      return (
        <>
          <span className="cmd-prefix">Weather</span>
          <span className="cmd-literal"> for </span>
          <span className="cmd-option">{city}</span>
          <span className="cmd-literal"> on </span>
          <span className="cmd-option">{date}</span>
          <span className="result-separator">: </span>
          <span className="result-field">Day</span>{" "}
          <span className="result-value">
            {forecast.dayweather} ({forecast.daytemp}°C)
          </span>
          , <span className="result-field">Night</span>{" "}
          <span className="result-value">
            {forecast.nightweather} ({forecast.nighttemp}°C)
          </span>
          .
        </>
      );
    }
    // Fallback to display string
    return (
      <span className="result-fallback">
        {resultDisplay || "Weather data unavailable"}
      </span>
    );
  };

  const renderTravelTimeResult = () => {
    // Example using display string (assuming resultData is not structured yet)
    // A more robust implementation would use structured resultData if available
    if (resultDisplay) {
      // Simple parsing example (adjust regex if display format changes)
      const parts = resultDisplay.match(/from (.*) to (.*): (.*)/i);
      if (parts) {
        return (
          <>
            <span className="cmd-prefix">From</span>{" "}
            <span className="cmd-option">{parts[1]}</span>{" "}
            <span className="cmd-literal">to</span>{" "}
            <span className="cmd-option">{parts[2]}</span>
            <span className="result-separator">: </span>
            <span className="result-value">{parts[3]}</span>
          </>
        );
      }
    }
    // Fallback or if resultData exists but isn't handled yet
    return (
      <span className="result-fallback">
        {resultDisplay || "Travel time unavailable"}
      </span>
    );
  };

  const renderError = () => {
    return (
      <span className="error">Error: {errorMessage || "Action failed"}</span>
    );
  };

  const renderContent = () => {
    if (status === "error") {
      return renderError();
    }
    console.log(`command name: ${commandName}`)
    switch (commandName) {
      case "Weather":
        return renderWeatherResult();
      case "From":
        return renderTravelTimeResult();
      // Add cases for other commands
      default:
        // Default rendering using display string if command rendering not specified
        return (
          <span className="result-fallback">
            {resultDisplay || "Result unavailable"}
          </span>
        );
    }
  };

  // NodeViewWrapper provides the outer element and necessary Tiptap bindings
  // Add contentEditable=false to prevent direct editing of the rendered spans
  return (
    <NodeViewWrapper
      as="span"
      className={`formulas-node status-${status}`}
      contentEditable={false}
    >
    {renderContent()}
    </NodeViewWrapper>
  );
};

export default FormulasComponent;
