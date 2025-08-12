"use client";

import "./style.scss";
import BlockEditor from "@/components/editor";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useBlockEditor } from "@/hooks/useBlockEditor";
import { HocuspocusProvider, WebSocketStatus } from "@hocuspocus/provider";
import dynamic from "next/dynamic";
import React, { useEffect, useRef, useState } from "react";
import { Doc as YDoc } from "yjs";
import { v4 as uuidv4 } from "uuid";
import { EditorHeader } from "../editor/components/editor-header";

import { Icon } from "../ui/icon";
import { Button } from "../ui/button";
import { PanelGroupOnLayout } from "react-resizable-panels";
const MapComponent = dynamic(() => import("@/components/map/MapComponent"), {
    ssr: false,
});

const componentMap = {
    map: MapComponent,
};

// Define the type for a single DYNAMIC panel in our state
type DynamicPanelType = {
    id: string;
    component: keyof typeof componentMap;
    size: number;
};

// The initial layout of dynamic panels
const initialDynamicPanels: DynamicPanelType[] = [];

const Workspace = ({
    ydoc,
    provider,
}: {
    ydoc: YDoc | null;
    provider?: HocuspocusProvider | null | undefined;
}) => {
    const [isEditable, setIsEditable] = useState(true);
    const [dynamicPanels, setDynamicPanels] =
        useState<DynamicPanelType[]>(initialDynamicPanels);
    const [editorSize, setEditorSize] = useState(100);
    const [fullscreenPanelId, setFullscreenPanelId] = useState<string | null>(
        null,
    );
    const [layoutKey, setLayoutKey] = useState(0);
    const [isExitingFullscreen, setIsExitingFullscreen] = useState(false);

    // Forces a re-mount of the panel group when exiting fullscreen.
    useEffect(() => {
        if (!fullscreenPanelId) {
            setLayoutKey((prevKey) => prevKey + 1);
        }
    }, [fullscreenPanelId]);

    const { editor, users, collabState } = useBlockEditor({
        ydoc,
        provider,
        onTransaction({ editor: currentEditor }) {
            setIsEditable(currentEditor.isEditable);
        },
    });

    // This function re-balances the layout evenly among all panels.
    const rebalanceLayout = (panels: DynamicPanelType[]) => {
        const totalPanels = 1 + panels.length; // 1 for the main editor
        if (totalPanels <= 1) {
            setEditorSize(100);
            return;
        }
        const newSize = 100 / totalPanels;
        setEditorSize(newSize);
        setDynamicPanels(panels.map((p) => ({ ...p, size: newSize })));
    };

    const togglePanel = (type: keyof typeof componentMap) => {
        // Check if a panel with the given type already exists
        const panelIndex = dynamicPanels.findIndex(
            (panel) => panel.component === type,
        );

        if (panelIndex > -1) {
            // Panel exists, so remove it and re-balance.
            const newPanels = dynamicPanels.filter(
                (_, index) => index !== panelIndex,
            );
            setDynamicPanels(newPanels); // Set first to get the correct length
            rebalanceLayout(newPanels);
        } else {
            // Panel doesn't exist, so add it.
            const newPanel = {
                id: uuidv4(),
                component: type,
                size: 0, // Placeholder, rebalanceLayout will calculate the real size
            };
            const newPanels = [...dynamicPanels, newPanel];
            setDynamicPanels(newPanels); // Set first to get the correct length
            rebalanceLayout(newPanels);
        }
    };

    const toggleFullscreen = (panelId: string) => {
        // Check if we are currently trying to exit fullscreen
        if (fullscreenPanelId === panelId) {
            setIsExitingFullscreen(true); // Trigger the exit animation
            // Wait for the animation to finish (200ms) before removing the component
            setTimeout(() => {
                setFullscreenPanelId(null);
                setIsExitingFullscreen(false); // Reset state for the next time
            }, 200);
        } else {
            setFullscreenPanelId(panelId); // Instantly set the panel to enter fullscreen
        }
    };

    const removePanel = (idToRemove: string) => {
        // If the removed panel was in fullscreen, handle exit animation
        if (fullscreenPanelId === idToRemove) {
            setIsExitingFullscreen(true); // Trigger the exit animation
            setTimeout(() => {
                const newPanels = dynamicPanels.filter(
                    (panel) => panel.id !== idToRemove,
                );
                setDynamicPanels(newPanels);
                rebalanceLayout(newPanels);
                setFullscreenPanelId(null); // Remove the fullscreen panel
                setIsExitingFullscreen(false); // Reset state
            }, 200);
        } else {
            // This logic runs if the panel is not in fullscreen
            const newPanels = dynamicPanels.filter(
                (panel) => panel.id !== idToRemove,
            );
            setDynamicPanels(newPanels);
            rebalanceLayout(newPanels);
        }
    };

    // This stops `rebalanceLayout` from overriding the user's choices.
    const handleLayout: PanelGroupOnLayout = (sizes: number[]) => {
        const [newEditorSize, ...newDynamicPanelSizes] = sizes;
        setEditorSize(newEditorSize);
        setDynamicPanels((currentPanels) =>
            currentPanels.map((panel, index) => ({
                ...panel,
                size: newDynamicPanelSizes[index],
            })),
        );
    };

    // Props are still resolved dynamically for the dynamic panels
    const getComponentProps = (type: keyof typeof componentMap) => {
        switch (type) {
            case "map":
                if (!editor) {
                    throw new Error("Editor is not available for MapComponent");
                }
                return { mainEditor: editor };
        }
    };

    const isMapPanelVisible = dynamicPanels.some(
        (panel) => panel.component === "map",
    );
    const fullscreenPanel = dynamicPanels.find(
        (p) => p.id === fullscreenPanelId,
    );

    // const menuContainerRef = useRef(null);
    return !editor || (
        <div className="relative flex flex-1 flex-col overflow-auto h-full">
            <EditorHeader
                editor={editor}
                collabState={collabState}
                users={users || undefined}
            >
                <div className="flex items-center gap-2">
                    <Button
                        variant={isMapPanelVisible ? "secondary" : "outline"}
                        className="bg-gray-200 hover:bg-gray-300"
                        size="sm"
                        onClick={() => togglePanel("map")}
                    >
                        <Icon name="Map" />
                    </Button>
                </div>
            </EditorHeader>

            {editor ? (
                <div className="flex-1 relative bg-gray-100">
                    <div
                        className={
                            fullscreenPanel ? "invisible h-full" : "h-full"
                        }
                    >
                        <ResizablePanelGroup
                            key={layoutKey}
                            direction="horizontal"
                            onLayout={handleLayout}
                        >
                            <ResizablePanel
                                defaultSize={editorSize}
                                minSize={20}
                                className="resizable-panel"
                            >
                                <div className="bg-white h-full w-full rounded-xl overflow-hidden">
                                    <BlockEditor
                                        editorProps={editor}
                                        isEditable={isEditable}
                                    />
                                </div>
                            </ResizablePanel>

                            {dynamicPanels.map((panel) => {
                                const Component = componentMap[panel.component];
                                const props = getComponentProps(
                                    panel.component,
                                );

                                return (
                                    <React.Fragment key={panel.id}>
                                        <ResizableHandle withHandle={true} />
                                        <ResizablePanel
                                            defaultSize={panel.size}
                                            minSize={20}
                                            className="resizable-panel"
                                        >
                                            <div className="relative bg-white h-full w-full rounded-xl overflow-hidden p-2 group/panel">
                                                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover/panel:opacity-100 transition-opacity duration-150 flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() =>
                                                            toggleFullscreen(
                                                                panel.id,
                                                            )
                                                        }
                                                    >
                                                        <Icon
                                                            name="Maximize"
                                                            className="h-4 w-4 text-gray-500"
                                                        />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() =>
                                                            removePanel(
                                                                panel.id,
                                                            )
                                                        }
                                                    >
                                                        <Icon
                                                            name="X"
                                                            className="h-4 w-4 text-gray-500"
                                                        />
                                                    </Button>
                                                </div>
                                                <Component {...props} />
                                            </div>
                                        </ResizablePanel>
                                    </React.Fragment>
                                );
                            })}
                        </ResizablePanelGroup>
                    </div>

                    {fullscreenPanel && (
                        <div
                            className={`absolute inset-0 bg-white z-20 p-2 rounded-xl ${isExitingFullscreen
                                    ? "animate-out"
                                    : "animate-in"
                                }`}
                        >
                            <div className="absolute top-2 right-2 z-30 flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() =>
                                        toggleFullscreen(fullscreenPanel.id)
                                    }
                                >
                                    <Icon
                                        name="Minimize"
                                        className="h-4 w-4 text-gray-500"
                                    />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() =>
                                        removePanel(fullscreenPanel.id)
                                    }
                                >
                                    <Icon
                                        name="X"
                                        className="h-4 w-4 text-gray-500"
                                    />
                                </Button>
                            </div>
                            {(() => {
                                const Component =
                                    componentMap[fullscreenPanel.component];
                                const props = getComponentProps(
                                    fullscreenPanel.component,
                                );
                                return <Component {...props} />;
                            })()}
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
};

export default Workspace;
