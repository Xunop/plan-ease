import React, { Ref, useEffect, useImperativeHandle, useState } from "react";
import "./List.scss";
import { Suggestion, Place } from "@/lib/api/types";
import { fetchPlaceDetails } from "@/lib/bridge/search";
import { useBoundStore } from "@/providers/location-store-provider";
import localforage from "localforage";

export interface SuggestionContentRef {
    // handleShow: () => void;
    // handleHide: () => void;
    handleKeydown: ({ event }: { event: KeyboardEvent }) => boolean;
}

interface MentionListProps {
    items: Suggestion[];
    command: (args: { id: string; label: string; location: string }) => void;
    ref: Ref<SuggestionContentRef>;
}

const MentionList: React.FC<MentionListProps> = ({
    items,
    command,
    ref,
}: MentionListProps) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const { AddLocation, places, AddPlace, RemovePlace } = useBoundStore(
        (state) => state,
    );

    const selectItem = async (index: number) => {
        const item = items[index];
        if (!item) return;

        try {
            // Fetch generic Place details from the bridge
            const placeDetails: Place | null = await fetchPlaceDetails(item);

            if (placeDetails) {
                // Add the generic Place to the store
                AddPlace(placeDetails);
                localforage.setItem(placeDetails.id, placeDetails); // Cache the generic Place

                // Execute the command with the details
                command({
                    id: placeDetails.id,
                    label: placeDetails.name,
                    location: placeDetails.location,
                });
            } else {
                console.warn("Could not fetch details for suggestion:", item);
            }
        } catch (error) {
            console.error("Error selecting item and fetching details:", error);
        }
    };

    const upHandler = () => {
        // console.log("up");
        setSelectedIndex((selectedIndex + items.length - 1) % items.length);
    };

    const downHandler = () => {
        // console.log("down");
        setSelectedIndex((selectedIndex + 1) % items.length);
    };

    const enterHandler = () => {
        selectItem(selectedIndex);
    };

    useEffect(() => setSelectedIndex(0), [items]);

    useImperativeHandle(ref, () => ({
        // handleShow: () => {
        //     console.log("show sug")
        //     setOpen(true);
        // },
        // handleHide: () => {
        //     setOpen(false);
        // },
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

    return (
        <div className="dropdown-menu">
            {items.length ? (
                items.map((item, index) => (
                    <button
                        className={index === selectedIndex ? "is-selected" : ""}
                        key={index}
                        onClick={() => selectItem(index)}
                        title={item.name || item.address}
                    >
                        {item.name}
                    </button>
                ))
            ) : (
                <div className="item">No result</div>
            )}
        </div>
    );
};

export default MentionList;
