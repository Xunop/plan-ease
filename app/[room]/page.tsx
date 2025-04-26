"use client";

import Workspace from "@/components/workspace";
import { useCollaboration } from "@/hooks/useCollaboration";
import { useSearchParams } from "next/navigation";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import {
    Popover,
    PopoverAnchor,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export default function Document({
    params,
}: {
    params: Promise<{ room: string }>;
}) {
    const { room } = React.use(params);
    const [open, setOpen] = useState(false);
    const searchParams = useSearchParams();
    const providerState = useCollaboration({
        docId: room,
        enabled: parseInt(searchParams?.get("noCollab") as string) !== 1,
    });

    if (providerState.state === "loading") return;

    const handleClick = () => {
        setOpen(!open);
    };
    return (
        <Workspace ydoc={providerState.yDoc} provider={providerState.provider} />
        // <div className="flex justify-center items-center min-h-screen">
        //     <Popover open={open}>
        //         <PopoverAnchor
        //             style={{
        //                 position: "absolute",
        //                 top: 500,
        //                 left: 50,
        //                 // display: "hide",
        //             }}
        //   asChild
        //         >
        //             {/* click */}
        //             <div onClick={handleClick}> click </div>
        //         </PopoverAnchor>
        //         <PopoverContent side="top" align="start" className="w-fit">
        //             <div className="dropdown-menu w-fit">
        //                 <div key="a">aaa</div>
        //                 <div key="b">bbb</div>
        //                 <div key="c">ccc</div>
        //             </div>
        //         </PopoverContent>
        //     </Popover>
        // </div>
    );
}
