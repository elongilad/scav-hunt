import { ReactNode } from "react";

export function PageHeader(props: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">{props.title}</h1>
        {props.subtitle && (
          <p className="text-sm text-gray-400 mt-1">{props.subtitle}</p>
        )}
      </div>
      {props.actions ? <div className="flex gap-2">{props.actions}</div> : null}
    </div>
  );
}
