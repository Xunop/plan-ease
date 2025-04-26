'use client';
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
import { useState } from "react";
import { Doc as YDoc } from "yjs";
import { EditorHeader } from "../editor/components/editor-header";

import { Icon } from "../ui/icon";
const MapComponent = dynamic(() => import("../map/leaflet"), { ssr: false });

const Workspace = ({
    ydoc,
    provider,
}: {
    ydoc: YDoc | null;
    provider?: HocuspocusProvider | null | undefined;
}) => {
    const [isEditable, setIsEditable] = useState(true);
    const { editor, users, collabState } = useBlockEditor({
        ydoc,
        provider,
        onTransaction({ editor: currentEditor }) {
            setIsEditable(currentEditor.isEditable);
        },
    });

    const [dragging, setDragging] = useState(false);

    // Custom styles for the handle, with focus on the design from the image
    const handleStyle: React.CSSProperties = {
        width: "6px", // Thin handle
        // height: "100%", // Full height of the parent container
        backgroundColor: dragging
            ? "rgba(255, 0, 255, 0.6)"
            : "rgba(200, 200, 200, 0.8)", // Background color change when dragging
        cursor: "ew-resize", // Horizontal resize cursor
        position: "relative",
        borderRadius: "3px", // Rounded edges to match design
    };

    const [isMapLoaded, setMapLoaded] = useState(false);
    const handleMapLoaded = () => {
        setMapLoaded(true);
    };

    // const menuContainerRef = useRef(null);
    return editor ? (
        <div
            className="relative flex-1 flex-col overflow-auto h-full"
        // ref={menuContainerRef}
        >
            <EditorHeader
                editor={editor}
                collabState={collabState}
                users={users || undefined}
            />
            <ResizablePanelGroup direction="horizontal" className="bg-gray-100">
                <ResizablePanel
                    defaultSize={50}
                    minSize={20}
                    className="resizable-panel"
                >
                    <BlockEditor editorProps={editor} isEditable={isEditable} />
                </ResizablePanel>
                <div className="flex-col flex justify-center items-center self-center h-full">
                    <div className="flex flex-col justify-center items-center h-full gap-2">
                        <div onClick={() => { }}>
                            <Icon name="Grid2x2Plus" className="text-gray-400" />
                        </div>
                        <ResizableHandle withHandle={true} />
                    </div>
                </div>
                <ResizablePanel
                    defaultSize={50}
                    minSize={20}
                    className="resizable-panel"
                >
                    <div className="bg-white h-full w-full rounded-xl overflow-hidden">
                        <MapComponent />
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    ) : null;
};

export default Workspace;
