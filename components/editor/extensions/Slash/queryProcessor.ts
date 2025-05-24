import Fuse, { IFuseOptions } from "fuse.js";

import { CommandSuggestion, QueryState, initialQueryState } from "./types";

// TODO: Need to use different keys to search for different commands
// Define how Fuse should search within the CommandSuggestion objects
const fuseOptions: IFuseOptions<CommandSuggestion> = {
  // `includeScore` is essential to get similarity scores
  includeScore: true,
  // `threshold` controls fuzziness (0=exact, 1=match anything). Adjust as needed.
  threshold: 0.4, // Start with a moderate threshold
  // `location` and `distance` control where matches are expected (0 = start, large distance = anywhere)
  location: 0,
  distance: 100, // Allow matches far apart within the string
  // `minMatchCharLength`: Minimum pattern length to consider a match
  minMatchCharLength: 2, // Ignore very short partial matches?
  // `ignoreLocation`: Set to true to match anywhere in the string, false to prioritize matches at the start. Let's try false.
  ignoreLocation: false,
  // `displayText` is likely the most important key.
  keys: [
    { name: "displayText", weight: 0.8 }, // Heavily weight the pre-formatted text
    { name: "commandPrefix", weight: 0.4 }, // Also consider the prefix itself
    // Optional: Search within specific option values if needed
    { name: "options.address", weight: 0.5 },
    { name: "options.date", weight: 0.3 },
  ],
};

/**
 * Processes user input to filter and rank a list of command suggestions using Fuse.js.
 * @param inputText The user's current input string.
 * @param allSuggestions The master list of CommandSuggestion objects.
 * @returns A QueryState reflecting the filtered and ranked suggestions.
 */
export function processCommandQuery(
  inputText: string,
  allSuggestions: CommandSuggestion[],
): QueryState {
  const trimmedInput = inputText.trim();
  let rankedSuggestions: CommandSuggestion[] = [];

  // Handle Initial/Special States
  if (!trimmedInput) {
    return { ...initialQueryState, inputText }; // Empty input -> empty suggestions
  }
  if (trimmedInput === "/") {
    // Return all suggestions, sorted alphabetically, no Fuse score needed
    rankedSuggestions = [...allSuggestions].sort((a, b) =>
      a.displayText.localeCompare(b.displayText),
    );
    // Add a dummy score if needed downstream, or handle absence of score
    rankedSuggestions = rankedSuggestions.map((s) => ({
      ...s,
      matchScore: 1.0,
    })); // Use 1.0 for display? Or 0? Fuse score is 0=best.
    return { ...initialQueryState, inputText, suggestions: rankedSuggestions };
  }
  if (!trimmedInput.startsWith("/")) {
    return { ...initialQueryState, inputText }; // Ignore if not starting with /
  }

  // Use Fuse.js for Filtering and Ranking

  // 1. Initialize Fuse with the suggestions list and options
  //    For performance, consider creating this Fuse instance only once outside this function
  //    if `allSuggestions` doesn't change often.
  const fuse = new (Fuse as any)(allSuggestions, fuseOptions); // Use 'as any' if Fuse type isn't directly available

  // 2. Perform the search using the trimmed input as the pattern
  const fuseResult = fuse.search(trimmedInput);

  // 3. Map Fuse results to our CommandSuggestion format, potentially transforming the score
  rankedSuggestions = fuseResult.map(
    (result: { item: CommandSuggestion; score: number }) => {
      // Fuse score: 0 = perfect match, 1 = worst match.
      // Let's convert to higher-is-better (1 - score) for consistency with previous attempts.
      const higherIsBetterScore = 1 - result.score;
      return {
        ...result.item,
        matchScore: parseFloat(higherIsBetterScore.toFixed(4)), // Add score to the item
      };
    },
  );

  // Fuse already returns sorted results by score (best first)

  // Return Final State
  return {
    inputText,
    suggestions: rankedSuggestions,
    isLoading: false,
    result: null,
    error: null,
  };
}
