import * as React from "react";

export default function Section({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={`py-16 md:py-24 ${className}`}>
      <div className="mx-auto max-w-screen-2xl px-4 md:px-6">{children}</div>
    </section>
  );
}
