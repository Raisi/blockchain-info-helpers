import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-display text-sm font-medium transition-all",
        variant === "primary" &&
          "bg-accent-primary text-bg-primary hover:bg-accent-primary/90",
        variant === "secondary" &&
          "border border-border-subtle bg-bg-card text-text-primary hover:bg-bg-card-hover",
        size === "sm" && "px-3 py-1.5 text-xs",
        size === "md" && "px-4 py-2",
        size === "lg" && "px-6 py-3 text-base",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
