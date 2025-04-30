//// queryProcessor.ts (Simplified for Suggestions)
//import {
//  CommandDefinition,
//  CommandResult,
//  // initialQueryState // Maybe define initialSuggestionState
//} from "./types";
//
//export function getCommandSuggestions(
//  inputText: string,
//  availableCommands: CommandDefinition[],
//): SuggestionQueryState {
//  // Return suggestion-specific state
//
//  const initialState: SuggestionQueryState = {
//    inputText,
//    potentialCommands: [],
//    explicitOptionsForBestMatch: {},
//  };
//
//  const normalizedInput = inputText.trimStart();
//  if (!normalizedInput.startsWith("/")) {
//    return initialState;
//  }
//
//  const firstSpaceIndex = normalizedInput.indexOf(" ");
//  const potentialCmdPrefix =
//    firstSpaceIndex === -1
//      ? normalizedInput
//      : normalizedInput.substring(0, firstSpaceIndex);
//
//  let potentialCommands = availableCommands.filter((cmd) =>
//    cmd.commandPrefix
//      .toLowerCase()
//      .startsWith(potentialCmdPrefix.toLowerCase()),
//  );
//
//  if (potentialCommands.length === 0 && potentialCmdPrefix !== "/") {
//    return initialState;
//  }
//  if (potentialCmdPrefix === "/" && potentialCommands.length === 0) {
//    potentialCommands = availableCommands; // Show all for "/"
//  }
//
//  // Try to parse explicit options for the *most likely* command based on prefix length
//  let bestMatchCommand: CommandDefinition | null = null;
//  let explicitOptions: Record<string, string> = {};
//
//  if (potentialCommands.length > 0) {
//    potentialCommands.sort(
//      (a, b) => b.commandPrefix.length - a.commandPrefix.length,
//    );
//    bestMatchCommand = potentialCommands[0]; // Pick longest prefix match
//
//    if (bestMatchCommand.parsingRegex && bestMatchCommand.optionOrder) {
//      const match = normalizedInput.match(bestMatchCommand.parsingRegex);
//      if (match) {
//        // Parsed explicit options based on current input
//        bestMatchCommand.optionOrder.forEach((optionName, index) => {
//          explicitOptions[optionName] = match[index + 1]?.trim() ?? "";
//        });
//      } else {
//        // Format doesn't fully match yet, initialize options as empty
//        bestMatchCommand.options.forEach((opt) => {
//          explicitOptions[opt.name] = "";
//        });
//      }
//    }
//  }
//
//  return {
//    inputText,
//    potentialCommands, // List of commands matching prefix
//    // Only include options if a best match command was found
//    explicitOptionsForBestMatch: bestMatchCommand ? explicitOptions : {},
//  };
//}
