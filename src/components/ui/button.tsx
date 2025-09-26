import * as React from "react";
import Link from "next/link";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string;
  variant?: "primary" | "secondary";
  children: React.ReactNode;
};

function Button({ href, variant = "primary", className = "", children, ...rest }: Props) {
  const base =
    "inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-base font-semibold transition active:scale-[.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal";
  const styles =
    variant === "primary"
      ? "bg-brand-500 text-white shadow-sm hover:shadow-md hover:bg-brand-600"
      : "border border-slate-200 text-slate-900 hover:bg-white";
  const cls = `${base} ${styles} ${className}`.trim();
  if (href) return (
    <Link className={cls} href={href}>
      {children}
    </Link>
  );
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}

export { Button };
export default Button;
