import { CommandDefinition, CommandSuggestion } from "./types";
import { commands as baseCommands } from "./commands"; // Import base definitions
import { getStore } from "@/providers/location-store-provider";
import { AmapPlace } from "@/lib/api/gaode/types";

const sampleOrigins = ["London", "Singapore", "Home"];
const sampleDestinations = ["Paris", "Work", "Airport", "KL"];

// Helper to format a suggestion's display text based on definition and options
// Prioritizes displayOptions for filling placeholders in the format string.
function formatDisplayText(
  definition: CommandDefinition,
  actionOptions: Record<string, string>, // Renamed for clarity
  displayOptions?: Record<string, string>,
): string {
  let text = definition.format;
  // Iterate through all possible keys from both option sets
  const allKeys = new Set([
    ...Object.keys(actionOptions),
    ...Object.keys(displayOptions ?? {}),
  ]);

  for (const key of allKeys) {
    const placeholder = `{${key}}`;
    if (text.includes(placeholder)) {
      // Use display value if available, otherwise use action value
      const valueToDisplay = displayOptions?.[key] ?? actionOptions[key];
      // Ensure we have a string value to substitute
      const substitution =
        valueToDisplay !== undefined ? String(valueToDisplay) : placeholder;
      text = text.replace(placeholder, substitution);
    }
  }

  // Clean up any remaining, unfilled placeholders and extra whitespace
  text = text
    .replace(/\{[a-zA-Z0-9_]+\}/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return text;
}

// --- Generate Suggestions ---
let suggestionIdCounter = 0;

export function generateInitialSuggestions(): CommandSuggestion[] {
  const suggestions: CommandSuggestion[] = [];
  const store = getStore();
  const { dates, locations, GetPlaceByLoc } = store.getState();

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
      console.log("Weather init", locations, dates);
      for (const loc of locations) {
        for (const d of dates) {
          const address = loc.location;
          const place= GetPlaceByLoc(address)

          console.log("place: ", place)

          const date = d.date;
          if (!place) {
              console.warn("Place is undefined")
              continue
          }

          const options = { address: place.adcode, date };
          const displayOpts = { address: loc.name, date: date };
          suggestions.push({
            id: `sugg-${suggestionIdCounter++}`,
            baseCommandName: commandDef.name,
            commandPrefix: commandDef.commandPrefix,
            options: options,
            displayOptions: displayOpts,
            displayText: formatDisplayText(commandDef, options, displayOpts),
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

/**
 * Regenerates the command suggestions based on the current state
 * (e.g., from the location store) and updates the exported
 * `initialSuggestions` variable.
 */
export function updateInitialSuggestions(): void {
  console.log("Updating initial suggestions...");
  initialSuggestions = generateInitialSuggestions();
  console.log(
    "Initial suggestions updated. New count:",
    initialSuggestions.length,
  );
  // Optional: Log a few examples of the new suggestions
  console.log("New Suggestions Sample:", initialSuggestions.slice(0, 5));
}

// Generate the list on load (or call this function when needed)
export let initialSuggestions = generateInitialSuggestions();

// console.log("Generated Suggestions:", initialSuggestions.slice(0, 5)); // Log a few examples
