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
import { useState } from "react";
import { Doc as YDoc } from "yjs";
import { EditorHeader } from "../editor/components/editor-header";

import { Icon } from "../ui/icon";
const MapComponent = dynamic(() => import("@/components/map/MapComponent"), { ssr: false });

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
                        <MapComponent mainEditor={editor}/>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    ) : null;
};

export default Workspace;
