// Define the types for the attributes our node will store
export interface FormulasAttributes {
  commandName: string | null;
  // Store display options used to trigger the command for rendering context
  displayOptions: Record<string, string> | null;
  // Store the structured result data from CommandResult.data
  resultData: any | null;
  // Store the fallback display string from CommandResult.display
  resultDisplay: string | null;
  // Indicate success or error
  status: 'success' | 'error'; // Keep it simple for now
  errorMessage: string | null;
}
