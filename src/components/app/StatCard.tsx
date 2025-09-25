import { ReactNode } from "react";

export function StatCard(props: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-gray-300 text-sm">{props.label}</div>
          <div className="text-2xl md:text-3xl font-semibold text-white mt-1">
            {props.value}
          </div>
          {props.hint && <div className="text-xs text-gray-500 mt-1">{props.hint}</div>}
        </div>
        {props.icon && <div className="opacity-70">{props.icon}</div>}
      </div>
    </div>
  );
}
