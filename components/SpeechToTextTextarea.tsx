"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface SpeechToTextTextareaProps {
  id: string;
  name?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  className?: string;
}

const MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

const DEFAULT_MESSAGE =
  "Record your voice and this app will send the clip to the server for transcription.";

export default function SpeechToTextTextarea({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  rows = 6,
  required = false,
  className,
}: SpeechToTextTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const valueRef = useRef(value);

  const [isSupported, setIsSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(DEFAULT_MESSAGE);

  const mimeType = useMemo(() => {
    if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
      return "";
    }

    return MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
  }, []);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    setIsSupported(
      typeof window !== "undefined" &&
        typeof navigator !== "undefined" &&
        Boolean(navigator.mediaDevices?.getUserMedia) &&
        typeof MediaRecorder !== "undefined",
    );
  }, []);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleToggleRecording = async () => {
    if (!isSupported) {
      setStatusMessage("Audio recording is not supported in this browser.");
      return;
    }

    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      setStatusMessage("Uploading your recording for transcription...");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );

      streamRef.current = stream;
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setStatusMessage("Recording failed. Please try again.");
        setIsRecording(false);
        cleanupMediaResources();
      };

      recorder.onstop = async () => {
        try {
          setIsTranscribing(true);
          const audioBlob = new Blob(chunksRef.current, {
            type: recorder.mimeType || mimeType || "audio/webm",
          });

          if (!audioBlob.size) {
            setStatusMessage("No audio was captured. Please try again.");
            return;
          }

          const transcript = await transcribeAudio(audioBlob, recorder.mimeType || mimeType);

          if (!transcript.trim()) {
            setStatusMessage("No transcript was returned. Please try speaking more clearly.");
            return;
          }

          onChange(appendTranscript(valueRef.current, transcript.trim()));
          setStatusMessage("Transcription added to your reflection.");
          textareaRef.current?.focus();
        } catch (error) {
          console.error(error);
          setStatusMessage(
            error instanceof Error
              ? error.message
              : "Transcription failed. Please try again.",
          );
        } finally {
          setIsTranscribing(false);
          cleanupMediaResources();
        }
      };

      recorder.start();
      setIsRecording(true);
      setStatusMessage("Recording... click again to stop and transcribe.");
      textareaRef.current?.focus();
    } catch (error) {
      console.error(error);
      setStatusMessage("Microphone access was denied or unavailable.");
      cleanupMediaResources();
    }
  };

  const buttonLabel = isTranscribing
    ? "Transcribing..."
    : isRecording
      ? "Stop recording"
      : "Record voice note";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
        <button
          type="button"
          onClick={handleToggleRecording}
          disabled={!isSupported || isTranscribing}
          aria-pressed={isRecording}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
        >
          <span aria-hidden="true">{isRecording ? "⏹" : "🎙️"}</span>
          {buttonLabel}
        </button>
      </div>
      <textarea
        ref={textareaRef}
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        required={required}
        className={className}
        placeholder={placeholder}
      />
      <p className="text-xs text-slate-500">{statusMessage}</p>
    </div>
  );

  function cleanupMediaResources() {
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsRecording(false);
  }
}

function appendTranscript(currentValue: string, transcript: string) {
  if (!currentValue.trim()) {
    return transcript;
  }

  const suffix = /[\s\n]$/.test(currentValue) ? "" : " ";
  return `${currentValue}${suffix}${transcript}`;
}

async function transcribeAudio(audioBlob: Blob, mimeType?: string) {
  const extension = getFileExtension(mimeType);
  const formData = new FormData();

  formData.append("file", new File([audioBlob], `reflection-recording.${extension}`, {
    type: mimeType || audioBlob.type || "audio/webm",
  }));

  const response = await fetch("/api/transcribeAudio", {
    method: "POST",
    body: formData,
  });

  const body = (await response.json()) as { text?: string; error?: string };

  if (!response.ok) {
    throw new Error(body.error || "Transcription failed. Please try again.");
  }

  return body.text || "";
}

function getFileExtension(mimeType?: string) {
  switch (mimeType) {
    case "audio/mp4":
      return "mp4";
    case "audio/ogg;codecs=opus":
      return "ogg";
    case "audio/webm":
    case "audio/webm;codecs=opus":
    default:
      return "webm";
  }
}
