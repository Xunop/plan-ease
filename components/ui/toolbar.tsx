import React, { ButtonHTMLAttributes, HTMLProps } from "react";

import { cn } from "@/lib/utils";
import { Surface } from "./surface";
import { Button, ButtonProps } from "./button";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

export type ToolbarWrapperProps = {
  shouldShowContent?: boolean;
  isVertical?: boolean;
} & HTMLProps<HTMLDivElement>;

function ToolbarWrapper({
  shouldShowContent = true,
  children,
  isVertical = false,
  className,
  ...rest
}: ToolbarWrapperProps) {
  const toolbarClassName = cn(
    "text-black inline-flex h-full leading-none gap-0.5",
    isVertical ? "flex-col p-2" : "flex-row p-1 items-center",
    className,
  );

  return (
    shouldShowContent && (
      <Surface
        data-slot="toolbar-wrapper"
        className={toolbarClassName}
        {...rest}
      >
        {children}
      </Surface>
    )
  );
}

export type ToolbarDividerProps = {
  horizontal?: boolean;
} & HTMLProps<HTMLDivElement>;

function ToolbarDivider({
  horizontal,
  className,
  ...rest
}: ToolbarDividerProps) {
  const dividerClassName = cn(
    "bg-neutral-200 dark:bg-neutral-800",
    horizontal
      ? "w-full min-w-[1.5rem] h-[1px] my-1 first:mt-0 last:mt-0"
      : "h-full min-h-[1.5rem] w-[1px] mx-1 first:ml-0 last:mr-0",
    className,
  );

  return (
    <div data-slot="toolbar-divider" className={dividerClassName} {...rest} />
  );
}

export type ToolbarButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  activeClassname?: string;
  tooltip?: string;
  tooltipShortcut?: string[];
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
};

function ToolbarButton({
  children,
  size = "icon",
  variant = "ghost",
  className,
  tooltip,
  tooltipShortcut,
  activeClassname,
  ...rest
}: ToolbarButtonProps) {

  const content = (
    <Button
      data-slot="toolbar-button"
      variant={variant}
      size={size}
      className={className}
      {...rest}
    >
      {children}
    </Button>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

export const Toolbar = {
  Wrapper: ToolbarWrapper,
  Divider: ToolbarDivider,
  Button: ToolbarButton,
};
