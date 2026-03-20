"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type SpeechRecognitionAlternative = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  0: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
};

type SpeechRecognitionEventLike = Event & {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionErrorEventLike = Event & {
  error: string;
  message?: string;
};

type SpeechRecognitionLike = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
  processLocally?: boolean;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

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

const DEFAULT_MESSAGE = "Dictate locally when your browser supports on-device speech recognition.";

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
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [statusMessage, setStatusMessage] = useState(DEFAULT_MESSAGE);
  const [recognitionKey, setRecognitionKey] = useState(0);

  const SpeechRecognitionApi = useMemo<SpeechRecognitionConstructor | null>(() => {
    if (typeof window === "undefined") return null;
    return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
  }, []);

  useEffect(() => {
    setIsSupported(Boolean(SpeechRecognitionApi));
  }, [SpeechRecognitionApi]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!SpeechRecognitionApi) {
      return;
    }

    const recognition = new SpeechRecognitionApi();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    if ("processLocally" in recognition) {
      recognition.processLocally = true;
      setStatusMessage("On-device speech recognition is available in this browser.");
    } else {
      setStatusMessage(
        "Speech recognition is available, but this browser may not guarantee fully on-device transcription.",
      );
    }

    recognition.onresult = (event) => {
      let nextTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        nextTranscript += event.results[index][0]?.transcript ?? "";
      }

      const normalizedTranscript = nextTranscript.trim();
      if (!normalizedTranscript) {
        return;
      }

      onChangeRef.current(appendTranscript(valueRef.current, normalizedTranscript));
      setStatusMessage("Transcription added. Continue speaking or stop the microphone.");
    };

    recognition.onerror = (event) => {
      setStatusMessage(mapRecognitionError(event.error));
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [SpeechRecognitionApi, recognitionKey]);

  const toggleListening = async () => {
    if (!recognitionRef.current) {
      setStatusMessage("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setStatusMessage("Microphone stopped.");
      setIsListening(false);
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      recognitionRef.current.start();
      setIsListening(true);
      setStatusMessage("Listening… speak naturally and your words will be added to the reflection.");
      textareaRef.current?.focus();
    } catch (error) {
      console.error(error);
      setStatusMessage("Microphone access was denied or unavailable.");
      setIsListening(false);
      setRecognitionKey((current) => current + 1);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
        <button
          type="button"
          onClick={toggleListening}
          disabled={!isSupported}
          aria-pressed={isListening}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
        >
          <span aria-hidden="true">{isListening ? "⏹" : "🎙️"}</span>
          {isListening ? "Stop voice input" : "Speak to text"}
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
}

function appendTranscript(currentValue: string, transcript: string) {
  if (!currentValue.trim()) {
    return transcript;
  }

  const suffix = /[\s\n]$/.test(currentValue) ? "" : " ";
  return `${currentValue}${suffix}${transcript}`;
}

function mapRecognitionError(error: string) {
  switch (error) {
    case "audio-capture":
      return "No microphone was found. Connect a microphone and try again.";
    case "not-allowed":
      return "Microphone access is blocked. Allow microphone access to use speech-to-text.";
    case "service-not-allowed":
      return "Speech recognition is blocked by the browser or system settings.";
    case "network":
      return "The browser reported a network dependency. For fully local STT, use a browser that supports on-device recognition.";
    case "no-speech":
      return "No speech was detected. Try again and speak a little closer to the microphone.";
    default:
      return "Speech recognition stopped unexpectedly. Please try again.";
  }
}
