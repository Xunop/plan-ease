import React from "react";

interface CursorProps {
  user: { name: string; color: string; };
  // user: Record<string, any>;
  // isCollaborator: boolean;
  clientId: number;
  // isTyping: boolean;
  ref: React.Ref<HTMLDivElement>;
}

const Cursor: React.FC<CursorProps> = React.memo(({ user, clientId, ref }) => {
  return (
    <span
      className="collaboration-cursor__caret"
      style={{ borderColor: user.color }}
      data-client-id={clientId}
    >
      <div
        className="collaboration-cursor__label"
        style={{ backgroundColor: user.color }}
        ref={ref}
      >
        {user.name}
      </div>
    </span>
  );
});

export default Cursor;
