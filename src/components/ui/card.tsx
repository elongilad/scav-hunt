import * as React from "react";

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`card p-6 md:p-8 ${className}`}>{children}</div>;
}
export function CardHover({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`card card-hover p-6 md:p-8 ${className}`}>{children}</div>;
}
export function CardContent({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}
export function CardHeader({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
}
export function CardTitle({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
}
export function CardDescription({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>;
}
