import { getStore, useBoundStore } from "@/providers/location-store-provider";
import { Editor } from "@tiptap/core";

/** Represents a segment of a command format string (literal text or an option). */
export type CommandSegment =
  | { type: "literal"; value: string }
  | { type: "option"; name: string };

/** Represents an option extracted from a command format */
export interface CommandOption {
  name: string; // e.g., "address", "date"
}

/** Represents the result of executing a command's action */
export interface CommandResult {
  /** Simple text display for the result */
  display: string;
  /** Optional: Any structured data associated with the result */
  data?: any;
  /** Optional: Indicate if the result is preliminary/placeholder */
  isPlaceholder?: boolean;
}

// Context passed to actions and resolvers
export interface CommandContext {
  editor: Editor;
  pos: number; // Position in the document where command is triggered/resolved
  store: ReturnType<typeof getStore>;
  // GetLocationById: (id: string) => Location | undefined;
}

// Represents the fully resolved, structured data for command options
// This structure should contain attributes needed for Tiptap node insertion
export type ResolvedOptions = Record<
  string,
  | any
  | {
      id?: string;
      label?: string;
      [key: string]: any; // Allow for other structured data per option type
    }
>;

/** Defines a command, its format, options, and action */
export interface CommandDefinition {
  /** Unique command name (e.g., "Weather", "From") */
  name: string;
  /** The command trigger string (e.g., "/Weather", "/From") */
  commandPrefix: string;
  /** Template string defining keywords and options (e.g., "/Weather in {address} on {date}") */
  format: string;
  /** List of options derived from the format */
  options: CommandOption[];
  /** Description for help/suggestions */
  description?: string;
  /** The function to execute for this command */
  action: (options: Record<string, string>) => Promise<CommandResult>;

  // --- Added for iterative parsing ---
  /** Parsed sequence of literals and options from the format string (generated during setup) */
  segments?: CommandSegment[];
  /** Order of option names corresponding to options in the format (generated during setup) */
  optionOrder?: string[];
  // --- Removed ---
  // parsingRegex?: RegExp; // Replaced by segments
}

// Represents a specific, pre-filled instance of a command
export interface CommandSuggestion {
  id: string; // Unique ID for this specific suggestion
  baseCommandName: string; // e.g., "Weather"
  commandPrefix: string; // e.g., "/Weather"
  // Options needed by the action function (e.g., IDs, coordinates)
  options: Record<string, string>;
  // Corresponding human-readable values for display/search
  displayOptions?: Record<string, string>;
  displayText: string; // Pre-formatted display string, e.g., "/Weather in city on date"
  // Optional: Reference to the base definition for format/action access
  baseDefinition?: CommandDefinition;
  // Optional: Score used for ranking during filtering
  matchScore?: number;
}

/** Represents the state of the query process based on user input */
export interface QueryState {
  inputText: string;
  // List of ranked suggestions matching the input
  suggestions: CommandSuggestion[];
  isLoading: boolean; // Could be true while filtering/ranking
  // Result might hold the outcome if a suggestion was explicitly executed
  result: CommandResult | null;
  error: string | null;
}

// --- Updated Initial State ---
export const initialQueryState: QueryState = {
  inputText: "",
  suggestions: [], // Start with no suggestions shown (until "/" or other input)
  isLoading: false,
  result: null,
  error: null,
};
