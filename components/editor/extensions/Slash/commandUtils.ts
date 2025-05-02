import {
  CommandDefinition,
  CommandSegment,
} from "./types";

/** Escapes special characters in a string for use in a RegExp. */
function escapeRegex(text: string): string {
  // Escape characters with special meaning in regex.
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Processes a command definition to generate its parsing segments and option order.
 * Mutates the passed command object.
 * @param command - The CommandDefinition object to process.
 */
export function preprocessCommand(command: CommandDefinition): void {
  const optionNames: string[] = [];
  const segments: CommandSegment[] = [];
  // Regex to find {optionName} placeholders.
  const placeholderRegex = /\{([a-zA-Z0-9_]+)\}/g;

  // Start parsing from the end of the command prefix.
  const formatBody = command.format.substring(command.commandPrefix.length);
  let lastIndex = 0;
  let match;

  // Reset regex state if it's global.
  placeholderRegex.lastIndex = 0;

  while ((match = placeholderRegex.exec(formatBody)) !== null) {
    const placeholder = match[0]; // e.g., "{address}"
    const optionName = match[1]; // e.g., "address"
    const index = match.index;

    // Add the literal text *before* this placeholder, if any.
    if (index > lastIndex) {
      segments.push({
        type: "literal",
        value: formatBody.substring(lastIndex, index),
      });
    }

    // Add the option placeholder.
    segments.push({ type: "option", name: optionName });
    optionNames.push(optionName);

    // Update lastIndex to point after the current placeholder.
    lastIndex = index + placeholder.length;
  }

  // Add any remaining literal text *after* the last placeholder.
  if (lastIndex < formatBody.length) {
    segments.push({ type: "literal", value: formatBody.substring(lastIndex) });
  }

  // Store the results in the command definition.
  command.segments = segments;
  command.optionOrder = optionNames;
  // Derive options structure from optionOrder
  command.options = optionNames.map((name) => ({ name }));

  // console.log(`Command: ${command.name}`, command.segments, command.optionOrder); // For debugging
}

export interface ParseForScoreResult {
  segmentsMatched: number; // How many definition segments were covered by input
  isCompleteStructureMatch: boolean; // Did input fully match the segments structure?
  extractedInputOptions: Record<string, string>; // Option values parsed *from the input*
  partialLiteralMatch: boolean; // Did the input end with a partial match of the *next expected* literal?;
}

/**
 * Parses input content against command segments to determine structural match and extract option values from the input.
 * @param inputContent The input text *after* the command prefix.
 * @param segments The command's structure definition (literals and options).
 * @param optionOrder The order of options defined in the command.
 * @returns ParseForScoreResult object.
 */
export function parseInputForScoring(
    inputContent: string,
    segments: CommandSegment[] | undefined,
    optionOrder: string[] | undefined
): ParseForScoreResult {

    const defaultOptions: Record<string, string> = {};
    (optionOrder ?? []).forEach(name => { defaultOptions[name] = ''; });

    const initialResult: ParseForScoreResult = {
        segmentsMatched: 0,
        isCompleteStructureMatch: false,
        extractedInputOptions: defaultOptions,
        partialLiteralMatch: false, // Initialize new flag
    };

    if (!segments || segments.length === 0 || !optionOrder) {
        initialResult.isCompleteStructureMatch = inputContent.trim() === '';
        return initialResult;
    }

    let remainingInput = inputContent.trimStart();
    let currentExtractedOptions = { ...defaultOptions };
    let segmentsMatchedCount = 0;
    let possibleFullMatch = true;
    let stoppedOnPartialLiteral = false; // Track if we stopped due to partial literal

    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];

        // Trim remaining input *before* checking segment - ensures partial literals work
        const currentRemainingInput = remainingInput.trimStart();
        if (!currentRemainingInput && i < segments.length) {
            possibleFullMatch = false;
            break; // Input ran out
        }
        // Use the trimmed version for matching this segment
        remainingInput = currentRemainingInput;


        if (segment.type === 'literal') {
            const trimmedLiteral = segment.value.trim();
            if (!trimmedLiteral) continue; // Skip empty literals

            const literalRegex = new RegExp(`^${escapeRegex(trimmedLiteral)}(?:\\s+|$)`, 'i');
            const match = remainingInput.match(literalRegex);

            if (match) {
                // Full literal match
                remainingInput = remainingInput.substring(match[0].length); // Consume match (will be trimmed next loop)
                segmentsMatchedCount++;
            } else {
                // --- Check for Partial Literal Match ---
                if (trimmedLiteral.toLowerCase().startsWith(remainingInput.toLowerCase())) {
                    // Input is a prefix of the expected literal (e.g., "i" for "in")
                    stoppedOnPartialLiteral = true;
                }
                 // --- End Check ---
                possibleFullMatch = false;
                break; // Stop structural parsing whether partial or no match
            }
        } else if (segment.type === 'option') {
            // Find the next non-empty literal segment
            let nextLiteralText: string | null = null;
            let nextLiteralPattern: RegExp | null = null;
            for (let j = i + 1; j < segments.length; j++) {
                if (segments[j].type === 'literal') {
                     const literalVal = (segments[j] as { type: 'literal'; value: string }).value.trim();
                     if (literalVal) {
                         nextLiteralText = literalVal;
                         nextLiteralPattern = new RegExp(`\\s+${escapeRegex(literalVal)}(?:\\s+|$)`, 'i');
                         break;
                     }
                }
            }

            let optionValue = '';
            let consumedLength = 0;

            if (nextLiteralPattern && nextLiteralText) {
                const nextMatch = remainingInput.match(nextLiteralPattern);
                if (nextMatch && typeof nextMatch.index === 'number' && nextMatch.index >= 0) {
                     // Found the exact next literal delimiter
                     optionValue = remainingInput.substring(0, nextMatch.index);
                     consumedLength = nextMatch.index;
                } else {
                    // --- Check for Partial Next Literal ---
                    // Does remainingInput contain something that the *next* literal starts with?
                    // Example: input "A City o", next literal "on"
                    let partialNextLiteralFound = false;
                    const potentialPartialLiteral = remainingInput.split(/\s+/).pop() || ''; // Get last word/part
                    if (potentialPartialLiteral && nextLiteralText.toLowerCase().startsWith(potentialPartialLiteral.toLowerCase())) {
                        // Found partial next literal (e.g., "o" matching start of "on")
                        // Option value is everything *before* this partial match
                        const partialIndex = remainingInput.toLowerCase().lastIndexOf(potentialPartialLiteral.toLowerCase());
                        if (partialIndex > 0) { // Ensure it's not at the very beginning
                           optionValue = remainingInput.substring(0, partialIndex).trimEnd();
                           consumedLength = partialIndex; // Consume up to the partial literal start
                           stoppedOnPartialLiteral = true; // Indicate we stopped due to partial match
                           partialNextLiteralFound = true;
                        }
                    }
                    // --- End Check ---

                    if (!partialNextLiteralFound) {
                        // Exact literal not found, partial literal not found, option consumes the rest
                        optionValue = remainingInput;
                        consumedLength = remainingInput.length;
                    }
                     possibleFullMatch = false; // Can't be full match if delimiter wasn't exact
                }
            } else {
                // This is the last option, consumes the rest of the input
                optionValue = remainingInput;
                consumedLength = remainingInput.length;
            }

            currentExtractedOptions[segment.name] = optionValue.trim();
            remainingInput = remainingInput.substring(consumedLength); // Consume option value (will be trimmed next loop)
            segmentsMatchedCount++; // Count the matched option segment

            if (!possibleFullMatch && remainingInput.trim()) {
                 // If we determined it wasn't a full match (missing/partial delimiter)
                 // AND there's still non-whitespace input left after consuming,
                 // it implies a structural mismatch (e.g., "/Weather in London on xx zz")
                 // We should probably stop here unless the remainingInput *is* the partial literal detected.
                 if (!stoppedOnPartialLiteral) { // If we didn't explicitly stop on a partial literal, remaining input is unexpected
                    // Let's reconsider: If possibleFullMatch is false, the loop should eventually break anyway.
                    // Let the loop condition handle this.
                 }
            }
             if (stoppedOnPartialLiteral) {
                 break; // Stop parsing if we ended on a partial literal
             }
        }
    }

    // Check for completeness
    const isCompleteStructureMatch = possibleFullMatch && segmentsMatchedCount === segments.length && remainingInput.trim() === '';

    return {
        segmentsMatched: segmentsMatchedCount,
        isCompleteStructureMatch: isCompleteStructureMatch,
        extractedInputOptions: currentExtractedOptions,
        partialLiteralMatch: stoppedOnPartialLiteral && !isCompleteStructureMatch, // Only true if we stopped *because* of it
    };
}
