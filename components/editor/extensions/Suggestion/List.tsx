import React, {
    Ref,
    useEffect,
    useImperativeHandle,
    useState,
} from "react";
import "./List.scss";
import { AmapPlace, AmapTip } from "@/lib/api/gaode/types";
import { generateFixedLengthId } from "@/lib/utils/index";
import {
    fetchAmapPlaceById,
    fetchAmapPlaceByKeywords,
} from "@/lib/api/gaode/search";
import { useBoundStore } from "@/providers/location-store-provider";
import localforage from "localforage";

export interface SuggestionContentRef {
    // handleShow: () => void;
    // handleHide: () => void;
    handleKeydown: ({ event }: { event: KeyboardEvent }) => boolean;
}

interface MentionListProps {
    items: AmapTip[];
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

    const selectItem = (index: number) => {
        const item = items[index];

        let place: AmapPlace;

        // FIXME: `location` still need more check.
        if (item) {
            // Use `location` as id, but formatted as `lng-lat`
            // let uniqueId: string;
            const uniqueId = generateFixedLengthId(8, "mention-");
            let location: string;
            const placeId = item.id;
            // The id will no return when search a city.
            if (Array.isArray(placeId) && placeId.length === 0) {
                // Fetch location if not available
                fetchAmapPlaceByKeywords(item.name)
                    .then((places) => {
                        place = places[0];
                        location = place.location;
                        // uniqueId = location.split(",")[0] + "-" + location.split(",")[1];

                        // When selected a place, we need to store it.
                        place.id = uniqueId;
                        AddPlace(place);
                        localforage.setItem(uniqueId, place).then(() => {
                            // command implement see Suggestion.tsx
                            command({
                                id: uniqueId,
                                label: place.name,
                                location: location,
                            });
                        });
                    })
                    .catch((error) => {
                        console.error("Error fetching place:", error);
                    });
            } else {
                // First get place from localforage, if not exist will to fetch from remote
                localforage.getItem(uniqueId).then((value) => {
                    if (value === null) {
                        fetchAmapPlaceById(placeId)
                            .then((places) => {
                                if (places.length > 0) {
                                    place = places[0];
                                    location = place.location;
                                    // uniqueId = location.split(",")[0] + "-" + location.split(",")[1];
                                    place.id = uniqueId;
                                    AddPlace(place);
                                    localforage
                                        .setItem(uniqueId, place)
                                        .then(() => {
                                            command({
                                                id: uniqueId,
                                                label: place.name,
                                                location: location,
                                            });
                                        });
                                } else {
                                    // uniqueId = item.location.split(",")[0] + "-" + item.location.split(",")[1];
                                    command({
                                        id: uniqueId,
                                        label: item.name,
                                        location: item.location,
                                    });
                                }
                            })
                            .catch((error) => {
                                console.error("Error fetching place:", error);
                            });
                    } else {
                        // AddLocation(location);
                        place.id = uniqueId;
                        AddPlace(place);
                    }
                });
            }
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
