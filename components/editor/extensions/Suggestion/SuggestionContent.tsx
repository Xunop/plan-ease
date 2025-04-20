"use client";

import {
    Popover,
    PopoverAnchor,
    PopoverContent,
    PopoverPortal,
    PopoverTrigger,
} from "@/components/ui/popover";
import React, { useEffect, useImperativeHandle, useRef, useState } from "react";
import { forwardRef } from "react";
import { Editor } from "@tiptap/core";
import "./List.scss";
import { AmapTip } from "@/lib/api/gaode/types";
import { fetchAmapGeocode } from "@/lib/api/gaode/search";

interface SuggestionContentProps {
    items: AmapTip[];
    editor: Editor;
    decorationNode: Element;
    command: (args: { id: string; label: string; location: string }) => void;
}

export interface SuggestionContentRef {
    handleShow: () => void;
    handleHide: () => void;
    handleKeydown: ({ event }: { event: KeyboardEvent }) => boolean;
}

const SuggestionContent = forwardRef<
    SuggestionContentRef,
    SuggestionContentProps
>((props, ref) => {
    const [open, setOpen] = useState<boolean>(false);

    useEffect(() => {
        // console.log("props", props);

        const pos = props.decorationNode?.getBoundingClientRect();
        // console.log("suggestion pos", pos);
        if (pos) {
            // Estimate the height of the PopoverContent
            const popoverHeight =
                popoverRef.current?.getBoundingClientRect().height || 200; // Fallback to 200px if not rendered yet
            const viewportHeight = window.innerHeight;

            // Margin to ensure some space between Popover and viewport edge
            const margin = 20;

            // Check if there's enough space below the anchor
            const spaceBelow = viewportHeight - pos.bottom;
            // console.log(
            //     `popoverHeight: ${popoverHeight}, viewportHeight: ${viewportHeight}, spcae: ${spaceBelow}`,
            // );
            if (spaceBelow < popoverHeight + margin) {
                // Not enough space below, show Popover above
                setSide("top");
            } else {
                // Enough space below, show Popover below
                setSide("bottom");
            }
            setPosition({
                top: pos.top,
                left: pos.left,
                height: pos.height,
                bottom: pos.bottom,
            });
        }
    }, [open]);

    useImperativeHandle(ref, () => ({
        handleShow: () => {
            // console.log("show");
            setOpen(true);
        },
        handleHide: () => {
            // console.log("hide");
            setOpen(false);
        },
        handleKeydown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === "ArrowUp") {
                upHandler();
                return true;
            }

            if (event.key === "ArrowDown") {
                downHandler();
                return true;
            }

            if (event.key === "Enter") {
                enterHandler();
                return true;
            }

            return false;
        },
    }));

    const [position, setPosition] = useState({
        top: 0,
        left: 0,
        height: 0,
        bottom: 0,
    });

    const [side, setSide] = useState<"top" | "bottom">("top");
    const popoverRef = useRef<HTMLDivElement>(null);

    // useEffect(() => {
    //     const pos = props.decorationNode?.getBoundingClientRect();
    //     console.log("suggestion pos", pos);
    //     if (pos) {
    //         setPosition({
    //             top: pos.top,
    //             left: pos.left,
    //             height: pos.height,
    //             bottom: pos.bottom,
    //         });
    //         // Estimate the height of the PopoverContent
    //         const popoverHeight =
    //             popoverRef.current?.getBoundingClientRect().height || 200; // Fallback to 200px if not rendered yet
    //         const viewportHeight = window.innerHeight;
    //
    //         // Margin to ensure some space between Popover and viewport edge
    //         const margin = 20;
    //
    //         // Check if there's enough space below the anchor
    //         const spaceBelow = viewportHeight - pos.bottom;
    //         console.log(`popoverHeight: ${popoverHeight}, viewportHeight: ${viewportHeight}, spcae: ${spaceBelow}`)
    //         if (spaceBelow < popoverHeight + margin) {
    //             // Not enough space below, show Popover above
    //             setSide("top");
    //         } else {
    //             // Enough space below, show Popover below
    //             setSide("bottom");
    //         }
    //     }
    // }, [props.decorationNode]);

    const [selectedIndex, setSelectedIndex] = useState(0);

    // TODO: DEV
    const selectItem = (index: number) => {
        const item = props.items[index];

        if (item) {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
            let location = item.location;
            console.log("test location", location)
            // If location is empty string, use other api to get location.
            if (Array.isArray(location) && location.length === 0) {
                // Fetch location if not available
                fetchAmapGeocode(item.name)
                    .then((geocodes) => {
                        location = geocodes?.length > 0 ? geocodes[0].location : "";
                        console.log(
                            geocodes?.length > 0
                                ? `New location fetched: ${location}`
                                : "No geocode data returned",
                        );
                        return location; // Pass to next .then
                    })
                    .catch((error) => {
                        console.error("Error fetching location:", error);
                        location = "";
                        return location; // Pass to next .then
                    })
                    .then(() => {
                        // Execute command with final location
                        props.command({
                            id: uniqueId,
                            label: item.name,
                            location: location || "",
                        });
                    });
            } else {
                props.command({
                    id: uniqueId,
                    label: item.name,
                    location: location,
                });
            }
        }
    };

    const upHandler = () => {
        // console.log("up");
        setSelectedIndex(
            (selectedIndex + props.items.length - 1) % props.items.length,
        );
    };

    const downHandler = () => {
        // console.log("down");
        setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
        selectItem(selectedIndex);
    };

    useEffect(() => setSelectedIndex(0), [props.items]);

    const handleOpenAutoFocus = () => {
        // console.log("Popover opened, focus will be set to the content.");
        // commandRef.current?.focus();

        props.editor.commands.focus(props.editor.view.state.selection.$anchor.pos);
        // console.log("focus", props.editor.view.hasFocus());
    };

    const handleCloseAutoFocus = () => {
        console.log("Popover closed, focus will be set to the trigger.");
        props.editor.commands.focus(props.editor.view.state.selection.$anchor.pos);
    };

    const handleEscapeKeyDown = () => {
        console.log("Escape key pressed, closing Popover.");
        // props.editor.commands.focus(props.editor.view.state.selection.$anchor.pos);
    };

    const handlePointerDownOutside = (event: any) => {
        console.log("Clicked outside the Popover, closing it.", event);
        setOpen(false);
    };

    const handleFocusOutside = () => {
        console.log("Focus moved outside the Popover, closing it.");
        setOpen(false);
    };

    const handleInteractOutside = () => {
        console.log("Interaction outside Popover detected, closing it.");
        setOpen(false);
    };

    // FIXME: The side props not affect the direction of the popover
    return (
        <Popover open={open}>
            {/* <PopoverAnchor */}
            {/*     style={{ */}
            {/*         position: "fixed", */}
            {/*         top: "100px", */}
            {/*         left: "200px", */}
            {/*     }} */}
            {/* > */}
            {/*     <div id="123456789">Anchor Here</div> */}
            {/* </PopoverAnchor> */}
            {/* <PopoverTrigger> */}
            {/*     DEBUG-CLICK */}
            {/* </PopoverTrigger> */}
            <PopoverContent
                ref={popoverRef}
                onOpenAutoFocus={handleOpenAutoFocus}
                // onCloseAutoFocus={handleCloseAutoFocus}
                onEscapeKeyDown={handleEscapeKeyDown}
                // onPointerDownOutside={handlePointerDownOutside}
                // onFocusOutside={handleFocusOutside}
                // onInteractOutside={handleInteractOutside}
                style={{
                    position: "absolute",
                    top: position.bottom,
                    left: position.left,
                }}
                side={side}
                align="start"
                // sideOffset={position.height}
                // sideOffset={10}
                className="w-fit"
            >
                <div className="dropdown-menu w-fit">
                    {props.items.length ? (
                        props.items.map((item, index) => (
                            <button
                                className={index === selectedIndex ? "is-selected" : ""}
                                key={index}
                                onClick={() => selectItem(index)}
                                title={item.name}
                            >
                                {item.name}
                            </button>
                        ))
                    ) : (
                        <div className="item">No result</div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
});

SuggestionContent.displayName = "SuggestionContent";

export default SuggestionContent;
