import { ReactNode, ElementType, useState } from "react";
import { NodeViewWrapper as TiptapNodeViewWrapper } from "@tiptap/react";

interface NodeViewWrapperProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  as?: ElementType;
  className?: string;
  children: ReactNode | ((props: { isHovered: boolean }) => ReactNode);
  // hovered: boolean;
}

export const NodeViewWrapper: React.FC<NodeViewWrapperProps> = ({
  as,
  className,
  children,
  // hovered,
  ...rest
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // const handleMouseEnter = () => {
  //   hovered = isHovered || hovered;
  //   setIsHovered(hovered);
  // };
  // const handleMouseLeave = () => {
  //   hovered = isHovered || hovered;
  //   setIsHovered(hovered);
  // };

  return (
    <TiptapNodeViewWrapper
      as={as}
      className={className}
      // onMouseEnter={handleMouseEnter}
      // onMouseLeave={handleMouseLeave}
      {...rest}
    >
      {children}
    </TiptapNodeViewWrapper>
  );
};
