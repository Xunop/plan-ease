import React, { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import "./List.scss";

interface DropdownMenuProps {
  items: string[];
  command: (args: { id: string }) => void;
}

// FIXME: Keep using forwardRef for this part until the TipTap team fixes this issue:https://github.com/ueberdosis/tiptap/issues/6110
// const DropdownMenu = ({ items, command, ref }: DropdownMenuProps) => {
const DropdownMenu = forwardRef(({items, command}: DropdownMenuProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = items[index];

    if (item) {
      command({ id: item });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + items.length - 1) % items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        upHandler();
        return true;
      }

      if (event.key === "ArrowDown") {
        console.log("arrow down")
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
    <div className="dropdown-menu w-fit">
      {items.length ? (
        items.map((item, index) => (
          <button
            className={index === selectedIndex ? "is-selected" : ""}
            key={index}
            onClick={() => selectItem(index)}
          >
            {item}
          </button>
        ))
      ) : (
        <div className="item">No result</div>
      )}
    </div>
  );
});

export default DropdownMenu;
