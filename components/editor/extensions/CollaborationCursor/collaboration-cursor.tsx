import React from "react";
import ReactDOM from "react-dom/client"; // Updated for React 18
import { Extension } from "@tiptap/core";
import { DecorationAttrs } from "@tiptap/pm/view";
import { yCursorPlugin } from "y-prosemirror";
import Cursor from "./components/Cursor"; // Import the Cursor React component
import { createPortal } from "react-dom";

type CollaborationCursorStorage = {
  users: { clientId: number; [key: string]: any }[];
  collaboratorsTyping: Set<number>; // Track collaborators who are typing
};

export interface CollaborationCursorOptions {
  provider: any;
  user: Record<string, any>;
  onUpdate: (users: { clientId: number; [key: string]: any }[]) => null;
}

const awarenessStatesToArray = (states: Map<number, Record<string, any>>) => {
  return Array.from(states.entries()).map(([key, value]) => {
    return {
      clientId: key,
      ...value.user,
    };
  });
};

export const CollaborationCursor = Extension.create<
  CollaborationCursorOptions,
  CollaborationCursorStorage
>({
  name: "collaborationCursor",

  priority: 999,

  addOptions() {
    return {
      provider: null,
      user: {
        name: null,
        color: null,
        ref: React.createRef<HTMLDivElement>(),
      },
      onUpdate: () => null,
    };
  },

  addStorage() {
    return {
      users: [],
      collaboratorsTyping: new Set<number>(), // Track collaborators who are typing
    };
  },

  // @ts-ignore
  addCommands() {
    return {
      updateUser: (attributes: Record<string, any>) => () => {
        this.options.user = attributes;

        this.options.provider.awareness.setLocalStateField(
          "user",
          this.options.user,
        );

        return true;
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      yCursorPlugin(
        (() => {
          this.options.provider.awareness.setLocalStateField(
            "user",
            this.options.user,
          );
          this.storage.users = awarenessStatesToArray(
            this.options.provider.awareness.states,
          );

          this.options.provider.awareness.on("update", () => {
            // Update user list when awareness states change
            this.storage.users = awarenessStatesToArray(
              this.options.provider.awareness.states,
            );
          });

          return this.options.provider.awareness;
        })(),
        {
          cursorBuilder: (user, clientId) => {
            const container = document.createElement("div");
            container.style.display = "inline";
            createPortal(
              <Cursor user={user} clientId={clientId} ref={user.ref} />,
              container,
            );

            return container;
          },
          selectionBuilder: (user) => ({
            nodeName: "span",
            class: "collaboration-cursor__selection",
            style: `background-color: ${user.color}`,
            "data-user": user.name,
          }),
        },
      ),
    ];
  },
});
