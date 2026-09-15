import React from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "./Button";
import { cn } from "../../utils/cn";

export function EmptyState({
  icon: Icon = FolderOpen,
  title = "No items found",
  description = "There are no items to display at this time.",
  actionText,
  onAction,
  className = ""
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 sm:p-12 text-center", className)}>
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h4 className="text-base font-semibold text-slate-800">{title}</h4>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mt-1 mb-5">
        {description}
      </p>
      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
