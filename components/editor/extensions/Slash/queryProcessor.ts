import { CommandSuggestion, QueryState, initialQueryState } from "./types";
import { parseInputForScoring } from "./commandUtils";

/**
 * Processes user input to filter and rank a list of command suggestions.
 * @param inputText The user's current input string.
 * @param allSuggestions The master list of CommandSuggestion objects.
 * @returns A QueryState reflecting the filtered and ranked suggestions.
 */
export function processCommandQuery(
  inputText: string,
  allSuggestions: CommandSuggestion[],
): QueryState {
  const trimmedInput = inputText.trim();
  const inputLower = trimmedInput.toLowerCase();

  let filteredRankedSuggestions: CommandSuggestion[] = [];

  // --- Handle Initial States ---
  if (!inputLower) return { ...initialQueryState, inputText };
  if (inputLower === "/") {
    filteredRankedSuggestions = allSuggestions.map((s) => ({
      ...s,
      matchScore: 1,
    }));
    filteredRankedSuggestions.sort((a, b) =>
      a.displayText.localeCompare(b.displayText),
    );
    return {
      ...initialQueryState,
      inputText,
      suggestions: filteredRankedSuggestions,
    };
  }
  if (!inputLower.startsWith("/")) return { ...initialQueryState, inputText };

  // --- Filtering and Scoring ---
  for (const suggestion of allSuggestions) {
    let score = 0;
    const suggestionPrefixLower = suggestion.commandPrefix.toLowerCase();

    const firstSpaceIndex = trimmedInput.indexOf(" ");
    const potentialCmdInputPrefix =
      inputLower === "/"
        ? "/"
        : firstSpaceIndex === -1
          ? inputLower
          : inputLower.substring(0, firstSpaceIndex);

    // console.log(`suggestionPrefixLower: ${suggestionPrefixLower}, potentialCmdInputPrefix: ${potentialCmdInputPrefix}`)
    // 1. Prefix Match
    if (!suggestionPrefixLower.startsWith(potentialCmdInputPrefix)) {
      continue; // Skip if command prefix doesn't match input start
    }
    score += 10;

    // 2. Structural Content Matching
    const inputContent = trimmedInput.substring(
      suggestion.commandPrefix.length,
    );
    const segments = suggestion.baseDefinition?.segments;
    const optionOrder = suggestion.baseDefinition?.optionOrder;

    if (!segments || !optionOrder) {
      // Fallback for commands without structure - simple contains check
      if (
        inputContent.trim() &&
        !suggestion.displayText
          .toLowerCase()
          .substring(suggestionPrefixLower.length)
          .includes(inputContent.toLowerCase())
      ) {
        score = 0; // Disqualify if input content isn't even contained
      } else if (!inputContent.trim()) {
        score += 5;
      } // Matches prefix only
    } else {
      // --- Use the structured parser ---
      const parseResult = parseInputForScoring(
        inputContent,
        segments,
        optionOrder,
      );

      // --- Refined Disqualification Check ---
      // Disqualify only if input has content, matches zero segments, AND didn't even partially match the next literal
      if (
        parseResult.segmentsMatched === 0 &&
        inputContent.trim() &&
        !parseResult.partialLiteralMatch
      ) {
        score = 0;
      } else {
        // --- Calculate Score ---
        // Base score for fully matched segments
        score += parseResult.segmentsMatched * 5;

        // Bonus if the input ended by partially matching the next expected literal
        if (parseResult.partialLiteralMatch) {
          // Slightly higher bonus if it was the *first* segment that was partial
          score += parseResult.segmentsMatched === 0 ? 5 : 3;
        }

        // Bonus for completing the *entire* command structure
        if (parseResult.isCompleteStructureMatch) {
          score += 15;
        }

        // Compare Extracted Input Options vs Suggestion Options
        let optionMatchScore = 0;
        for (const optionName in parseResult.extractedInputOptions) {
          const inputValue = parseResult.extractedInputOptions[optionName];
          const suggestionValue = suggestion.options[optionName];

          if (inputValue && suggestionValue) {
            const inputValueLower = inputValue.toLowerCase();
            const suggestionValueLower = suggestionValue.toLowerCase();

            if (inputValueLower === suggestionValueLower) {
              optionMatchScore += 20; // Exact match
            } else if (suggestionValueLower.startsWith(inputValueLower)) {
              optionMatchScore += 10; // Suggestion starts with Input
            } else if (inputValueLower.startsWith(suggestionValueLower)) {
              optionMatchScore += 8; // Input starts with Suggestion
            }
          }
        }
        score += optionMatchScore;
      }
    }

    // 3. Add to list if score is positive
    if (score > 0) {
      filteredRankedSuggestions.push({ ...suggestion, matchScore: score });
    }
  }

  // --- Sorting ---
  filteredRankedSuggestions.sort(
    (a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0),
  );

  // --- Return Final State ---
  return {
    inputText,
    suggestions: filteredRankedSuggestions,
    isLoading: false,
    result: null,
    error: null,
  };
}
