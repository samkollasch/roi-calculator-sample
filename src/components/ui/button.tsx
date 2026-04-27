import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "cancel";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-primary text-white hover:bg-black focus-visible:outline-black",
  secondary:
    "bg-white text-black border border-black/10 hover:bg-brand-primary hover:text-white focus-visible:outline-neutral-500",
  ghost: "bg-transparent text-black hover:bg-neutral-100",
  cancel: "bg-white text-black border border-black/10 hover:bg-neutral-100",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={`inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantStyles[variant]} ${className}`}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
