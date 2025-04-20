import { HocuspocusProvider } from "@hocuspocus/provider";
import { useEffect, useState } from "react";
import { Doc as YDoc } from "yjs";

function getProvider({ docId, yDoc }: { docId: string; yDoc: YDoc }) {
  return new HocuspocusProvider({
    name: `${process.env.NEXT_PUBLIC_COLLAB_DOC_PREFIX}${docId}`,
    url: "ws://127.0.0.1:1234",
    document: yDoc,
  });
}

interface UseCollaborationProps {
  docId: string;
  enabled?: boolean;
}

interface ProviderState {
  state: "loading" | "idle" | "loaded";
  provider: HocuspocusProvider | null;
  yDoc: YDoc | null;
}

export const useCollaboration = ({
  docId,
  enabled = true,
}: UseCollaborationProps): ProviderState => {
  const [provider, setProvider] = useState<ProviderState>({
    state: enabled ? "loading" : "idle",
    provider: null,
    yDoc: null,
  });

  useEffect(() => {
    let isMounted = true;

    if (enabled) {
      // When enabled, initialize the provider and yDoc
      const yDoc = new YDoc(); // Initialize the YDoc instance
      const providerInstance = getProvider({ docId, yDoc }); // Initialize the provider with the docId

      if (isMounted) {
        setProvider({
          state: "loaded",
          provider: providerInstance,
          yDoc,
        });
      }
    } else {
      // If not enabled, set the state to idle
      setProvider({ state: "idle", provider: null, yDoc: null });
    }

    return () => {
      // Cleanup to prevent setting state after unmount
      isMounted = false;
    };
  }, [docId, enabled]);

  return provider;
};
