import { useState, useEffect } from "react";
import { useAutoComplete } from "@uiw/react-amap";

// Custom hook for searching tips
const useAutoCompleteSearch = (query: string): Promise<string[]> => {
  const [isClient, setIsClient] = useState(false);

  // Client-side check (runs only once after component mounts)
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true); // We are in the browser
    }
  }, []);

  // Search function to be called only on the client-side
  const searchTips = (): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      if (isClient) {
        const { autoComplete } = useAutoComplete();

        autoComplete?.search(query, (status: any, result: any) => {
          if (status === "OK") {
            const tips = result.tips || [];
            resolve(tips); // Resolve the promise with the found tips
          } else {
            reject("Error fetching tips"); // Reject if there's an issue with the search
          }
        });
      } else {
        reject("Client-side only"); // Reject if trying to use on the server-side
      }
    });
  };

  // If not on the client, return a promise that rejects
  return isClient ? searchTips() : Promise.reject("Client-side only");
};

export default useAutoCompleteSearch;
