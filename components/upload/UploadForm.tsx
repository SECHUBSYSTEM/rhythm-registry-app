"use client";

import { useState, useCallback, useRef } from "react";
import {
  Upload,
  X,
  Music,
  FileAudio,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import api from "@/lib/api";
import type { Track, UploadState } from "@/types";

interface UploadFormProps {
  onSuccess?: (track: Track) => void;
}

export default function UploadForm({ onSuccess }: UploadFormProps) {
  const [state, setState] = useState<UploadState>({
    file: null,
    title: "",
    description: "",
    progress: 0,
    status: "idle",
  });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedFormats = ".mp3,.wav,.flac,.aac,.ogg,.m4a";
  const maxSizeMB = 200;

  const handleFile = useCallback((file: File) => {
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: `File too large (${sizeMB.toFixed(0)} MB). Maximum is ${maxSizeMB} MB.`,
      }));
      return;
    }

    const validTypes = [
      "audio/mpeg",
      "audio/wav",
      "audio/flac",
      "audio/aac",
      "audio/ogg",
      "audio/mp4",
      "audio/x-m4a",
    ];
    if (
      !validTypes.includes(file.type) &&
      !file.name.match(/\.(mp3|wav|flac|aac|ogg|m4a)$/i)
    ) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error:
          "Invalid file format. Please upload an audio file (MP3, WAV, FLAC, AAC, OGG, M4A).",
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      file,
      title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
      status: "idle",
      error: undefined,
    }));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.file || !state.title.trim()) return;

    setState((prev) => ({ ...prev, status: "uploading", progress: 0, error: undefined }));

    const formData = new FormData();
    formData.append("file", state.file);
    formData.append("title", state.title.trim());
    if (state.description.trim()) formData.append("description", state.description.trim());

    try {
      const { data } = await api.post<Track>("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (ev) => {
          if (ev.total) {
            const p = Math.round((ev.loaded / ev.total) * 100);
            setState((prev) => ({ ...prev, progress: p }));
          }
        },
      });
      setState((prev) => ({ ...prev, status: "complete", progress: 100 }));
      onSuccess?.(data);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : "Upload failed.";
      setState((prev) => ({
        ...prev,
        status: "error",
        error: msg ?? "Upload failed.",
      }));
    }
  };

  const resetForm = () => {
    setState({
      file: null,
      title: "",
      description: "",
      progress: 0,
      status: "idle",
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const fileSizeMB = state.file
    ? (state.file.size / (1024 * 1024)).toFixed(1)
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Drop zone */}
      <div
        className="relative rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer"
        style={{
          borderColor: isDragging
            ? "var(--rose-primary)"
            : state.file
              ? "var(--success)"
              : "var(--border-default)",
          background: isDragging
            ? "rgba(136, 19, 55, 0.08)"
            : "var(--bg-elevated)",
          padding: "2.5rem 1.5rem",
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !state.file && fileInputRef.current?.click()}>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="hidden"
        />

        <div className="flex flex-col items-center text-center gap-3">
          {state.file ? (
            <>
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: "rgba(29, 185, 84, 0.15)" }}>
                <FileAudio size={24} style={{ color: "var(--success)" }} />
              </div>
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}>
                  {state.file.name}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-muted)" }}>
                  {fileSizeMB} MB
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  resetForm();
                }}
                className="btn btn-ghost btn-sm"
                style={{ color: "var(--text-muted)" }}>
                <X size={14} />
                Remove
              </button>
            </>
          ) : (
            <>
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: "var(--bg-highlight)" }}>
                <Upload size={24} style={{ color: "var(--text-muted)" }} />
              </div>
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}>
                  Drop your audio file here
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--text-muted)" }}>
                  MP3, WAV, FLAC, AAC, OGG, M4A · Up to {maxSizeMB} MB
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm mt-1"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}>
                <Music size={14} />
                Browse files
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error message */}
      {state.status === "error" && state.error && (
        <div
          className="flex items-start gap-2 p-3 rounded-lg text-sm"
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            color: "var(--error)",
          }}>
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          {state.error}
        </div>
      )}

      {/* Title input */}
      <div>
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: "var(--text-secondary)" }}>
          Title <span style={{ color: "var(--rose-light)" }}>*</span>
        </label>
        <input
          type="text"
          className="input"
          placeholder="Enter track title"
          value={state.title}
          onChange={(e) =>
            setState((prev) => ({ ...prev, title: e.target.value }))
          }
          required
          disabled={
            state.status === "uploading" || state.status === "processing"
          }
        />
      </div>

      {/* Description input */}
      <div>
        <label
          className="block text-sm font-medium mb-2"
          style={{ color: "var(--text-secondary)" }}>
          Description
        </label>
        <textarea
          className="input"
          placeholder="Describe your track (optional)"
          rows={3}
          value={state.description}
          onChange={(e) =>
            setState((prev) => ({ ...prev, description: e.target.value }))
          }
          disabled={
            state.status === "uploading" || state.status === "processing"
          }
        />
      </div>

      {/* Upload progress */}
      {(state.status === "uploading" || state.status === "processing") && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span style={{ color: "var(--text-secondary)" }}>
              {state.status === "uploading"
                ? "Uploading..."
                : "Processing audio..."}
            </span>
            <span
              className="tabular-nums"
              style={{ color: "var(--text-muted)" }}>
              {state.progress}%
            </span>
          </div>
          <div className="progress-bar" style={{ height: "6px" }}>
            <div
              className="progress-bar-fill"
              style={{
                width: `${state.progress}%`,
                transition: "width 200ms ease",
              }}
            />
          </div>
        </div>
      )}

      {/* Success message */}
      {state.status === "complete" && (
        <div
          className="flex items-center gap-3 p-4 rounded-lg animate-fade-in-up"
          style={{
            background: "rgba(29, 185, 84, 0.1)",
            border: "1px solid rgba(29, 185, 84, 0.2)",
          }}>
          <CheckCircle2 size={20} style={{ color: "var(--success)" }} />
          <div>
            <p
              className="text-sm font-medium"
              style={{ color: "var(--success)" }}>
              Upload complete!
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Your track is now available for streaming.
            </p>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="btn btn-sm btn-outline ml-auto">
            Upload another
          </button>
        </div>
      )}

      {/* Submit */}
      {state.status !== "complete" && (
        <button
          type="submit"
          className="btn btn-primary btn-lg w-full"
          disabled={
            !state.file ||
            !state.title.trim() ||
            state.status === "uploading" ||
            state.status === "processing"
          }
          style={{
            opacity:
              !state.file ||
              !state.title.trim() ||
              state.status === "uploading" ||
              state.status === "processing"
                ? 0.5
                : 1,
          }}>
          <Upload size={18} />
          {state.status === "uploading"
            ? "Uploading..."
            : state.status === "processing"
              ? "Processing..."
              : "Upload Track"}
        </button>
      )}
    </form>
  );
}
