import React from "react";
import { Sparkles } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

export function ComingSoonModal({
  isOpen,
  onClose,
  title = "Coming Soon",
  body = "This feature is currently under development and will be available in a future update."
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      title={title}
    >
      <div className="text-center py-2 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
          <Sparkles className="w-6 h-6 text-indigo-600" />
        </div>
        <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
          {body}
        </p>
        <div className="pt-2 flex justify-center">
          <Button
            variant="primary"
            size="md"
            onClick={onClose}
            className="px-6"
          >
            Understood
          </Button>
        </div>
      </div>
    </Modal>
  );
}
