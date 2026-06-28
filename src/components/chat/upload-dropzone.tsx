"use client";

import { Loader2, Upload } from "lucide-react";

import type { MaterialType } from "@/lib/types";

export function UploadDropzone({
  accept,
  disabled,
  loading,
  materialType,
  onUpload,
  subtitle,
  title,
}: {
  accept: string;
  disabled: boolean;
  loading: boolean;
  materialType: MaterialType;
  onUpload: (file: File, materialType: MaterialType) => void;
  subtitle: string;
  title: string;
}) {
  return (
    <label className={`student-upload-dropzone ${disabled || loading ? "is-disabled" : ""}`}>
      <span>{loading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}</span>
      <strong>{title}</strong>
      <small>{subtitle}</small>
      <input
        accept={accept}
        className="sr-only"
        disabled={disabled || loading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onUpload(file, materialType);
          }
          event.currentTarget.value = "";
        }}
        type="file"
      />
    </label>
  );
}
