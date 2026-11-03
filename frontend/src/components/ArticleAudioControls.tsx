import { useEffect, useRef, useState } from "react";
import "../styles/ArticleAudioControls.css";

type Props = { title: string; summary: string; contentHtml: string };
type PlaybackState = "idle" | "speaking" | "paused" | "error";
const MAX_CHUNK_LENGTH = 220;

function richTextToPlainText(html: string): string {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  parsed.querySelectorAll("script, style, video, audio, iframe, object, embed, img, svg, canvas")
    .forEach(element => element.remove());
  const blockTags = new Set(["ADDRESS", "ARTICLE", "BLOCKQUOTE", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "LI", "OL", "P", "PRE", "SECTION", "TABLE", "TR", "UL"]);
  const collectText = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    if (!(node instanceof Element)) return "";
    const text = Array.from(node.childNodes, collectText).join("");
    return blockTags.has(node.tagName) ? ` ${text} ` : text;
  };
  return collectText(parsed.body).replace(/\s+/g, " ").trim();
}

function splitIntoChunks(text: string): string[] {
  const chunks: string[] = [];
  let current = "";
  for (const sentence of text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [text]) {
    const part = sentence.trim();
    if (!part) continue;
    if (part.length > MAX_CHUNK_LENGTH) {
      if (current) chunks.push(current.trim());
      current = "";
      for (let offset = 0; offset < part.length; offset += MAX_CHUNK_LENGTH) {
        chunks.push(part.slice(offset, offset + MAX_CHUNK_LENGTH).trim());
      }
    } else if (current.length + part.length + 1 > MAX_CHUNK_LENGTH) {
      chunks.push(current.trim());
      current = part;
    } else {
      current = `${current} ${part}`.trim();
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

export default function ArticleAudioControls({ title, summary, contentHtml }: Props) {
  const [state, setState] = useState<PlaybackState>("idle");
  const [rate, setRate] = useState(1);
  const chunks = useRef<string[]>([]);
  const chunkIndex = useRef(0);
  const generation = useRef(0);

  useEffect(() => () => {
    generation.current += 1;
    window.speechSynthesis?.cancel();
  }, []);

  const stop = () => {
    generation.current += 1;
    chunks.current = [];
    chunkIndex.current = 0;
    window.speechSynthesis?.cancel();
    setState("idle");
  };

  const play = () => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setState("error");
      return;
    }
    const text = [title, summary, richTextToPlainText(contentHtml)].filter(Boolean).join(". ");
    chunks.current = splitIntoChunks(text);
    chunkIndex.current = 0;
    generation.current += 1;
    const currentGeneration = generation.current;
    window.speechSynthesis.cancel();

    const speakNext = () => {
      if (generation.current !== currentGeneration) return;
      const chunk = chunks.current[chunkIndex.current];
      if (!chunk) { setState("idle"); return; }
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = document.documentElement.lang || "en";
      utterance.rate = rate;
      utterance.onstart = () => { if (generation.current === currentGeneration) setState("speaking"); };
      utterance.onend = () => {
        if (generation.current !== currentGeneration) return;
        chunkIndex.current += 1;
        speakNext();
      };
      utterance.onerror = event => {
        if (generation.current !== currentGeneration || event.error === "canceled") return;
        setState("error");
      };
      window.speechSynthesis.speak(utterance);
    };
    if (chunks.current.length) speakNext();
  };

  const pauseOrResume = () => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (state === "paused") { synth.resume(); setState("speaking"); }
    else { synth.pause(); setState("paused"); }
  };

  return (
    <div className="article-audio-controls" aria-label="Listen to this article">
      {state === "idle" || state === "error" ? (
        <button type="button" onClick={play}>Listen to article</button>
      ) : (
        <>
          <button type="button" onClick={pauseOrResume}>{state === "paused" ? "Resume" : "Pause"}</button>
          <button type="button" onClick={stop}>Stop</button>
        </>
      )}
      <label>Speed
        <select value={rate} onChange={event => setRate(Number(event.target.value))} aria-label="Speech speed">
          <option value={0.75}>0.75×</option><option value={1}>1×</option>
          <option value={1.25}>1.25×</option><option value={1.5}>1.5×</option>
        </select>
      </label>
      <span className="article-audio-status" role="status" aria-live="polite">
        {state === "speaking" ? "Reading article" : state === "paused" ? "Playback paused" : ""}
        {state === "error" ? "Speech playback is unavailable in this browser." : ""}
      </span>
    </div>
  );
}
