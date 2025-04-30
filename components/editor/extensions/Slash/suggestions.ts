import { CommandDefinition, CommandSuggestion } from "./types";
import { commands as baseCommands } from "./commands"; // Import base definitions

// --- Sample Data ---
const sampleAddresses = ["London", "Paris", "Singapore", "New York", "Tokyo", "南京市"];
const sampleDates = ["2025-05-10", "2025-05-11", "Tomorrow", "Next Monday"];
const sampleOrigins = ["London", "Singapore", "Home"];
const sampleDestinations = ["Paris", "Work", "Airport", "KL"];

// Helper to format a suggestion's display text based on definition and options
function formatDisplayText(
  definition: CommandDefinition,
  options: Record<string, string>,
): string {
  let text = definition.format;
  for (const key in options) {
    text = text.replace(`{${key}}`, options[key] || `{${key}}`); // Replace or keep placeholder if option missing
  }
  // Clean up remaining placeholders if any option was missing in the provided map
  text = text.replace(/\{[a-zA-Z0-9_]+\}/g, ""); // Remove unfilled placeholders
  text = text.replace(/\s{2,}/g, " ").trim(); // Clean up extra spaces
  return text;
}

// --- Generate Suggestions ---
let suggestionIdCounter = 0;

export function generateInitialSuggestions(): CommandSuggestion[] {
  const suggestions: CommandSuggestion[] = [];

  for (const commandDef of baseCommands) {
    if (!commandDef.optionOrder) {
      // Handle commands with no options - create one suggestion
      if ((commandDef.options?.length ?? 0) === 0) {
        suggestions.push({
          id: `sugg-${suggestionIdCounter++}`,
          baseCommandName: commandDef.name,
          commandPrefix: commandDef.commandPrefix,
          options: {},
          displayText: commandDef.commandPrefix, // Display text is just the prefix
          baseDefinition: commandDef,
        });
      }
      continue; // Skip if options structure isn't defined
    }

    // Generate suggestions based on command type
    if (commandDef.name === "Weather") {
      for (const address of sampleAddresses) {
        for (const date of sampleDates) {
          const options = { address, date };
          suggestions.push({
            id: `sugg-${suggestionIdCounter++}`,
            baseCommandName: commandDef.name,
            commandPrefix: commandDef.commandPrefix,
            options: options,
            displayText: formatDisplayText(commandDef, options),
            baseDefinition: commandDef,
          });
        }
      }
    } else if (commandDef.name === "From") {
      for (const origin of sampleOrigins) {
        for (const destination of sampleDestinations) {
          // Avoid suggesting travel from/to same place if desired
          if (origin === destination) continue;
          const options = { origin, destination };
          suggestions.push({
            id: `sugg-${suggestionIdCounter++}`,
            baseCommandName: commandDef.name,
            commandPrefix: commandDef.commandPrefix,
            options: options,
            displayText: formatDisplayText(commandDef, options),
            baseDefinition: commandDef,
          });
        }
      }
    }
    // Add logic for other command types here
  }

  return suggestions;
}

// Generate the list on load (or call this function when needed)
export const initialSuggestions = generateInitialSuggestions();

// console.log("Generated Suggestions:", initialSuggestions.slice(0, 5)); // Log a few examples
