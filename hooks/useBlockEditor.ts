'use client';
import ExtensionKit from "@/components/editor/extensions/extension-kit";
import Suggestion from "@/components/editor/extensions/Suggestion";
import { EditorUser } from "@/components/editor/types";
import { HocuspocusProvider, WebSocketStatus } from "@hocuspocus/provider";
import { Editor, EditorOptions } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import Mention from "../components/editor/extensions/Mention";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { useEditor, useEditorState } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { Doc as YDoc } from "yjs";

declare global {
    interface Window {
        editor: Editor | null;
    }
}
export const useBlockEditor = ({
    ydoc,
    provider,
    userId,
    ...editorOptions
}: {
    ydoc: YDoc | null;
    provider?: HocuspocusProvider | null | undefined;
    userId?: string;
} & Partial<Omit<EditorOptions, "extensions">>) => {
    const [collabState, setCollabState] = useState<WebSocketStatus>(
        provider ? WebSocketStatus.Connecting : WebSocketStatus.Disconnected,
    );
    const minimalAttrs = {
        commandName: "Weather",
        status: "success",
        resultDisplay: "Minimal Test",
    };
    const contentToInsert = [
        // {
        //   type: "formulas",
        //   attrs: minimalAttrs,
        // },
        {
            type: "text",
            text: " ", // Add space immediately after
        },
    ];
    const editor = useEditor({
        ...editorOptions,
        // FIXME: In client side, we should set to true, but tiptap will throw ssr error
        immediatelyRender: false,
        shouldRerenderOnTransaction: true,
        autofocus: true,
        editorProps: {
            attributes: {
                autocomplete: "off",
                autocorrect: "off",
                autocapitalize: "off",
                class: "min-h-full",
            },
        },

        content: `<h1>NumPad Demo with math.js</h1>
    <p>Try editing the calculations!</p>
    <h2>Arithmetic & Units</h2>
    <p>2 * (10kg + 500g) in grams</p>
    <p>5 feet + 10 inches in cm</p>
    <p>200 USD in EUR</p>
    <h2>Variables</h2>
    <p>price = 150 GBP</p>
    <p>vat = 20%</p>
    <p>total = price * (1 + vat)</p>
    <h2>Line References</h2>
    <p>100</p>
    <p>line 12 * 2</p>
    <p>sum(line 12, line 13)</p>
    `,

        onCreate: (ctx) => {
            if (provider && !provider.isSynced) {
                provider.on("synced", () => {
                    setTimeout(() => { }, 0);
                });
            } else if (ctx.editor.isEmpty) {
                ctx.editor.commands.focus("start", { scrollIntoView: true });
            }
        },
        extensions: [...ExtensionKit({ ydoc, provider })],
    });

    useEffect(() => {
        provider?.on("status", (event: { status: WebSocketStatus }) => {
            setCollabState(event.status);
        });
    }, [provider]);

    // Store timeouts for each client
    const clientTimeouts = useRef<Map<number, NodeJS.Timeout>>(new Map());

    useEffect(() => {
        const awareness = provider?.awareness;
        if (awareness) {
            awareness.on(
                "change",
                (
                    {
                        added,
                        updated,
                        removed,
                    }: {
                        added: number[];
                        updated: number[];
                        removed: number[];
                    },
                    transactionOrigin: any,
                ) => {
                    updated.forEach((clientId: number) => {
                        // Show cursor label if the user is active
                        const cursorLabel = document.querySelector(
                            `[data-client-id="${clientId}"]`,
                        ) as HTMLElement;
                        if (cursorLabel) cursorLabel.style.display = "block";

                        // Clear previous timeout if exists
                        if (clientTimeouts.current.has(clientId)) {
                            clearTimeout(clientTimeouts.current.get(clientId));
                        }

                        // Set a new timeout to hide the cursor after 3 seconds of inactivity
                        const timeoutId = setTimeout(() => {
                            const cursorLabel = document.querySelector(
                                `[data-client-id="${clientId}"]`,
                            ) as HTMLElement;
                            if (cursorLabel) cursorLabel.style.display = "none";
                        }, 3000);

                        // Store the timeout id for this client
                        clientTimeouts.current.set(clientId, timeoutId);
                    });
                },
            );
        }

        // Cleanup function to clear any active timeouts when the component is unmounted
        return () => {
            clientTimeouts.current.forEach((timeoutId) =>
                clearTimeout(timeoutId),
            );
            clientTimeouts.current.clear();
        };
    }, [provider]);

    const users = useEditorState({
        editor,
        selector: (ctx): (EditorUser & { initials: string })[] => {
            if (!ctx.editor?.storage.collaborationCaret?.users) {
                return [];
            }

            return ctx.editor.storage.collaborationCaret.users.map(
                (user: EditorUser) => {
                    const names = user.name?.split(" ");
                    const firstName = names?.[0];
                    const lastName = names?.[names.length - 1];
                    const initials = `${firstName?.[0] || "?"}${lastName?.[0] || "?"}`;

                    return {
                        ...user,
                        initials: initials.length ? initials : "?",
                    };
                },
            );
        },
    });

    window.editor = editor;

    return { editor, users, collabState };
};
