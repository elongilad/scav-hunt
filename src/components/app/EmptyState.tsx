import { ReactNode } from "react";

export function EmptyState(props: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-10 text-center">
      <div className="flex justify-center mb-4">{props.icon}</div>
      <h3 className="text-white text-lg font-semibold">{props.title}</h3>
      {props.description && (
        <p className="text-gray-400 text-sm mt-2">{props.description}</p>
      )}
      {props.action && <div className="mt-5">{props.action}</div>}
    </div>
  );
}
