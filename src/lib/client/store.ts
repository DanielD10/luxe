"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_ORIGIN, ORIGINS } from "@/lib/travel";

/**
 * Per-visitor state kept in this browser: saved places and home
 * airport. Wrapped so private windows and blocked storage just fall
 * back to defaults.
 */

const KEY_SAVED = "luxe.saved.v1";
const KEY_ORIGIN = "luxe.origin.v1";
const EVT = "luxe:store";

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage blocked; state still updates for this page view */
  }
  memory.set(key, value);
  window.dispatchEvent(new Event(EVT));
}

const memory = new Map<string, string>();
const get = (key: string) => memory.get(key) ?? read(key);

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY_SAVED || e.key === KEY_ORIGIN) {
      memory.clear();
      cb();
    }
  };
  window.addEventListener(EVT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

/* saved places */

let savedCacheRaw: string | null | undefined;
let savedCache: string[] = [];
function savedSnapshot(): string[] {
  const raw = get(KEY_SAVED);
  if (raw !== savedCacheRaw) {
    savedCacheRaw = raw;
    try {
      const v = JSON.parse(raw ?? "[]");
      savedCache = Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 60) : [];
    } catch {
      savedCache = [];
    }
  }
  return savedCache;
}
const EMPTY: string[] = [];

export function useSaved(): string[] {
  return useSyncExternalStore(subscribe, savedSnapshot, () => EMPTY);
}

export function toggleSaved(slug: string): boolean {
  const cur = savedSnapshot();
  const on = !cur.includes(slug);
  write(KEY_SAVED, JSON.stringify(on ? [...cur, slug] : cur.filter((s) => s !== slug)));
  return on;
}

export function setSaved(list: string[]): void {
  write(KEY_SAVED, JSON.stringify([...new Set(list)]));
}

/* home airport */

function originSnapshot(): string {
  const v = get(KEY_ORIGIN);
  return v && ORIGINS.some((o) => o.code === v) ? v : DEFAULT_ORIGIN;
}

export function useOrigin(): string {
  return useSyncExternalStore(subscribe, originSnapshot, () => DEFAULT_ORIGIN);
}

export function setOrigin(code: string): void {
  if (ORIGINS.some((o) => o.code === code)) write(KEY_ORIGIN, code);
}

/* toast */

export function toast(text: string): void {
  window.dispatchEvent(new CustomEvent("luxe:toast", { detail: text }));
}
