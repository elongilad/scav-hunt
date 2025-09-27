import * as React from "react";
import Link from "next/link";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "default" | "link" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
};

function Button({ href, variant = "primary", size = "md", loading = false, loadingText, className = "", children, ...rest }: Props) {
  const sizeClasses =
    size === "sm"
      ? "px-3 py-2 text-sm"
      : size === "lg"
      ? "px-6 py-4 text-lg"
      : "px-5 py-3 text-base";
  const base =
    `inline-flex items-center gap-2 rounded-2xl font-semibold transition active:scale-[.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${sizeClasses}`;
  const styles =
    variant === "primary"
      ? "bg-brand-teal text-white shadow-sm hover:shadow-md hover:bg-brand-teal/90"
      : variant === "outline"
      ? "border border-brand-teal text-brand-navy hover:bg-brand-sky hover:text-brand-navy"
      : variant === "ghost"
      ? "text-brand-navy hover:bg-brand-sky hover:text-brand-navy"
      : variant === "default"
      ? "bg-brand-sky text-brand-navy hover:bg-brand-teal/20"
      : variant === "link"
      ? "text-brand-teal underline-offset-4 hover:underline"
      : variant === "destructive"
      ? "bg-red-600 text-white hover:bg-red-700"
      : "border border-gray-200 text-brand-navy hover:bg-brand-sky";
  const cls = `${base} ${styles} ${className}`.trim();
  const content = loading ? (loadingText || "Loading...") : children;

  if (href) return (
    <Link className={cls} href={href}>
      {content}
    </Link>
  );
  return (
    <button className={cls} disabled={loading} {...rest}>
      {content}
    </button>
  );
}

export { Button };
export default Button;
