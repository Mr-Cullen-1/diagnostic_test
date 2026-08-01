import type { ButtonHTMLAttributes, ReactNode } from "react";

type PlatformButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary";
};

export default function PlatformButton({
  children,
  className = "",
  type = "button",
  variant = "primary",
  ...props
}: PlatformButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`platform-button platform-button--${variant} ${className}`.trim()}
    >
      {children}
    </button>
  );
}
