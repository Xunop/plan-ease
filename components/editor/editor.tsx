"use client";

// import styles from "./style.module.scss";
import "./style.scss";
import { Editor } from "@tiptap/core";
import { EditorContent } from "@tiptap/react";

import { ContentItemMenu } from "@/components/menu/content-item-menu";
import { Doc as YDoc } from "yjs";

import { HocuspocusProvider } from "@hocuspocus/provider";

import { useBoundStore } from "@/providers/location-store-provider";
import ButtonList from "./components/ButtonList";
import { useEffect, useRef, useState } from "react";

interface EditorProps {
    ydoc: YDoc | null;
    provider?: HocuspocusProvider | null | undefined;
}

// Custom hook to manage fade-out logic
// const useFadeOut = (isOpen: boolean, setIsOpen: (open: boolean) => void) => {
//     const [opacity, setOpacity] = useState(1);
//
//     useEffect(() => {
//         let timer: NodeJS.Timeout | null = null;
//         let fadeOutInterval: NodeJS.Timeout | null = null;
//
//         if (isOpen) {
//             setOpacity(1); // Reset opacity when the ButtonList opens
//             timer = setTimeout(() => {
//                 fadeOutInterval = setInterval(() => {
//                     setOpacity((prev) => {
//                         if (prev > 0) {
//                             return prev - 0.1; // Decrease opacity
//                         }
//                         clearInterval(fadeOutInterval!); // Stop the interval
//                         setIsOpen(false); // Close the ButtonList
//                         return 1; // Reset opacity for next time
//                     });
//                 }, 500);
//             }, 3000);
//         }
//
//         // Cleanup function to prevent memory leaks
//         return () => {
//             if (timer) clearTimeout(timer);
//             if (fadeOutInterval) clearInterval(fadeOutInterval);
//         };
//     }, [isOpen, setIsOpen]);
//
//     return opacity;
// };
const useFadeOut = (isOpen: boolean, setIsOpen: (open: boolean) => void) => {
    const [opacity, setOpacity] = useState(1);

    useEffect(() => {
        let timer: NodeJS.Timeout | null = null;
        let fadeOutInterval: NodeJS.Timeout | null = null;

        if (isOpen) {
            setOpacity(1); // Reset opacity when the ButtonList opens
            timer = setTimeout(() => {
                fadeOutInterval = setInterval(() => {
                    setOpacity((prev) => {
                        if (prev > 0) {
                            return prev - 0.1; // Decrease opacity
                        }
                        clearInterval(fadeOutInterval!); // Stop the interval
                        return 0; // Set opacity to 0
                    });
                }, 500);
            }, 3000);
        }

        // Cleanup function to prevent memory leaks
        return () => {
            if (timer) clearTimeout(timer);
            if (fadeOutInterval) clearInterval(fadeOutInterval);
        };
    }, [isOpen]);

    // Separate effect to handle closing when opacity reaches 0
    useEffect(() => {
        if (opacity <= 0 && isOpen) {
            setIsOpen(false); // Close the ButtonList
            setOpacity(1); // Reset opacity for next time
        }
    }, [opacity, isOpen, setIsOpen]);

    return opacity;
};

const BlockEditor = ({
    editorProps,
    isEditable,
}: {
    editorProps: Editor;
    isEditable: boolean;
}) => {
    const { buttonListOpen, buttonListPos, SetButtonListOpen } = useBoundStore(
        (state) => state,
    );

    // useEffect(() => {
    //   if (!editorProps.isFocused) {
    //     SetButtonListOpen(false);
    //   }
    // }, [editorProps.isFocused]);

    // const opacity = useFadeOut(buttonListOpen, SetButtonListOpen);

    const outerDivRef = useRef<HTMLDivElement>(null);
    return editorProps ? (
        <div
            className="relative flex-1 flex-col overflow-auto h-full"
            ref={outerDivRef}
        >
            <EditorContent
                editor={editorProps}
                spellCheck={false}
                // className={`${styles.tiptap} ${styles.body} ${styles["column-half"]} flex-1 overflow-y-auto h-full rounded-3xl bg-white`}
                className="flex-1 overflow-y-auto h-full rounded-3xl bg-white"
            ></EditorContent>
            {buttonListOpen && (
                <div
                    className="transition-opacity duration-500 ease-in-out"
                // style={{ opacity: opacity }}
                >
                    <ButtonList
                        pos={buttonListPos}
                        outerDivRef={outerDivRef}
                        editor={editorProps}
                    />
                </div>
            )}
            <ContentItemMenu editor={editorProps} isEditable={isEditable} />
        </div>
    ) : null;
};

export default BlockEditor;
