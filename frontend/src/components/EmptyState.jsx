import React from "react";

export default function EmptyState({ title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 border border-dashed border-base-700 rounded-xl">
      <div className="text-base-100 font-medium">{title}</div>
      <div className="text-sm text-base-500 mt-1 max-w-sm">{message}</div>
      {action}
    </div>
  );
}
