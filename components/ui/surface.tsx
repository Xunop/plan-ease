import { cn } from "@/lib/utils";
import { HTMLProps } from "react";

export type SurfaceProps = HTMLProps<HTMLDivElement> & {
  withShadow?: boolean;
  withBorder?: boolean;
};

export function Surface({
  children,
  className,
  withShadow = true,
  withBorder = true,
  ...props
}: SurfaceProps) {
  const surfaceClass = cn(
    "bg-white rounded-lg dark:bg-black",
    withShadow && "shadow-sm",
    withBorder && "border border-neutral-200 dark:border-neutral-800",
    className
  );

  return (
    <div data-slot="surface" className={surfaceClass} {...props}>
      {children}
    </div>
  );
}
