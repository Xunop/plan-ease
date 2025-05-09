import { Icon } from "@/components/ui/icon";
import { useBoundStore } from "@/providers/location-store-provider";
import { Editor } from "@tiptap/core";
import React  from "react";

interface ButtonListComponentProps {
    buttons: {
        icon: React.ReactNode; // Icon component or SVG
        onClick: () => void; // Click handler for each button
    }[];
    top: number;
}

const ButtonListComponent: React.FC<ButtonListComponentProps> = ({
    buttons,
    top,
}) => {
    return (
        <div
            className="flex flex-col items-center gap-2 p-1 bg-white right-1"
            style={{ position: "absolute", top: `${top}px` }}
        >
            {buttons.map((button, index) => (
                <button
                    key={index}
                    onClick={button.onClick}
                    className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-200 focus:outline-none"
                >
                    {button.icon}
                </button>
            ))}
        </div>
    );
};

type ButtonListProps = {
    pos: {
        left: number;
        right: number;
        top: number;
        bottom: number;
        lineHeight: number;
        nodePos: number;
    };
    outerDivRef?: React.RefObject<any>;
    editor: Editor;
};

const ButtonList = ({ pos, outerDivRef, editor }: ButtonListProps) => {
    const docSize = editor.state.doc.content.size;
    if (pos.nodePos < 0 || pos.nodePos >= docSize) {
        console.warn("Invalid position:", pos.nodePos);
        return null;
    }

    const { GetRoute, UpdateRoute, AddRoute } = useBoundStore((state) => state);

    const node = editor.state.doc.nodeAt(pos.nodePos);
    const handleMapclick = () => {
        const locations = [] as string[];
        let id = "";
        node?.descendants((child) => {
            if (child.type.name === "mention") {
                if (child.attrs.location !== "") {
                    locations.push(child.attrs.location);
                    // Use first mention id as route id.
                    if (id === "") {
                        id = child.attrs.id;
                    }
                }
            }
        });
        const route = { id: id, locations: locations };
        if (GetRoute(id) === undefined) {
            console.log("Add route", route);
            AddRoute(route);
        } else {
            console.log("update route", route);
            UpdateRoute(id, route);
        }
    };

    // useEffect(() => {
    //     console.log("locations: ", locations);
    // }, [locations]);

    const buttons = [
        {
            icon: <Icon name="Map" className="w-6 h-6" />,
            onClick: handleMapclick,
        },
        {
            icon: <Icon name="Calendar" className="w-6 h-6" />,
            onClick: () => console.log("Calendar clicked"),
        },
        {
            icon: <Icon name="Bike" className="w-6 h-6" />,
            onClick: () => console.log("Bicycle clicked"),
        },
    ];

    let relativeTop = pos.bottom ? pos.bottom : 0;
    if (outerDivRef?.current) {
        const outerDivRect = outerDivRef.current.getBoundingClientRect();
        // First minus viewport-relative top of the outer `div`
        // Minus row height to align with item
        relativeTop = relativeTop - outerDivRect.top - pos.lineHeight;
    }

    return <ButtonListComponent buttons={buttons} top={relativeTop} />;
};

export default ButtonList;
