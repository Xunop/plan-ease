"use client";

import Text from "@tiptap/extension-text";

import CharacterCount from "@tiptap/extension-character-count";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";

import OrderedList from "@tiptap/extension-ordered-list";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Strike from "@tiptap/extension-strike";
import Underline from "@tiptap/extension-underline";
import Heading from "@tiptap/extension-heading";
import Blockquote from "@tiptap/extension-blockquote";

import { StarterKit } from ".";
import ListItem from "@tiptap/extension-list-item";
import BulletList from "@tiptap/extension-bullet-list";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Focus from "@tiptap/extension-focus";
import Document from "@tiptap/extension-document";

import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
// import { CollaborationCursor } from "./CollaborationCursor/collaboration-cursor";
import { Doc as YDoc } from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { generateRandomColor, generateRandomUsername } from "@/lib/utils/index";
import { AnyExtension } from "@tiptap/core";
import React, { useEffect } from "react";
import Cursor from "./CollaborationCursor/components/Cursor";
// import Mention from "@tiptap/extension-mention";
import Mention from "./Mention";
import Suggestion from "./Suggestion";
import { PlanItem } from "./PlanItem";
import PlanList from "./PlanList";
import DateNode from "./Date/Date";
import { Slash } from "./Slash/Slash";
import CommandSuggestion from "./Slash/CommandSuggestion";
import { FormulasExtension } from "./Formulas/Formulas";
import { CalculationExtension } from "./Calculation/CalculationExtension";

export const ExtensionKit = ({
  ydoc,
  provider,
}: {
  ydoc?: YDoc | null | undefined;
  provider?: HocuspocusProvider | null | undefined;
}) => {
  const extensions: AnyExtension[] = [
    // Must need
    Document,
    Text,

    CharacterCount,

    // Bold,
    // Italic,
    // Strike,
    Underline,

    Focus,

    // Node
    // ListItem,
    // BulletList.extend({
    //   addKeyboardShortcuts() {
    //     return {
    //       Enter: ({ editor }) => {
    //         return false;
    //       },
    //     };
    //   },
    // }),
    OrderedList,
    TaskList,
    TaskItem.configure({
      nested: true,
    }),

    // DataRoute,
    PlanList,
    PlanItem,
    DateNode,
    Slash.configure({
        suggestion: CommandSuggestion,
    }),
    // // Mention
    Mention.configure({
      suggestion: Suggestion,
    }),
    FormulasExtension,

    CalculationExtension,

    // Heading.configure({
    //   levels: [1, 2, 3],
    // }),
    Blockquote,

    TextAlign.extend({
      addKeyboardShortcuts() {
        return {};
      },
    }).configure({
      types: ["heading", "paragraph"],
    }),

    StarterKit.configure({
      document: false,
      dropcursor: false,
      heading: false,
      horizontalRule: false,
      blockquote: false,
      codeBlock: false,
      orderedList: false,
      history: false,
    }),
  ];

  if (provider && ydoc) {
    extensions.push(
      Collaboration.configure({ document: ydoc, field: "content" }), // Main editor content field
    );
  }
  if (provider) {
    extensions.push(
      CollaborationCursor.configure({
        provider,
        user: {
          clientId: provider.awareness?.clientID,
          name: generateRandomUsername(),
          color: generateRandomColor(),
          ref: React.createRef<HTMLDivElement>(),
        },
        render: (user) => {
          const cursor = document.createElement("span");
          cursor.classList.add("collaboration-cursor__caret");
          cursor.setAttribute("style", `border-color: ${user.color}`);

          const label = document.createElement("div");
          label.classList.add("collaboration-cursor__label");
          label.setAttribute("style", `background-color: ${user.color}`);
          label.insertBefore(document.createTextNode(user.name), null);
          label.setAttribute("data-client-id", user.clientId);
          cursor.insertBefore(label, null);

          return cursor;
        },
      }),
    );
  }
  return extensions;
};

export default ExtensionKit;
