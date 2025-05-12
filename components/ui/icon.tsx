import { cn } from '@/lib/utils'
import { icons, LucideProps } from "lucide-react";
import { memo } from "react";

export type IconProps = {
  name: keyof typeof icons;
  className?: string;
  strokeWidth?: number;
} & Omit<LucideProps, 'name' | 'className' | 'strokeWidth'>;

export const Icon = memo(({ name, className, strokeWidth = 2.5, ...rest }: IconProps) => {
  const IconComponent = icons[name];
  if (!IconComponent) return null;

  return <IconComponent data-slot="icon" className={cn("w-4 h-4", className)} strokeWidth={strokeWidth} {...rest}/>;
});
