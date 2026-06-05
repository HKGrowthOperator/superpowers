// core/store.js — the single source of truth for the whole hub.
// Holds every module's data, cross-module bookmarks, theme and routing.
// UI never keeps its own state; it reads here and mutates via these methods.
//
// "Shared workspace" model: seed data lives in the repo (the agent can edit it);
// anything you add in the UI is kept under _userAdded and persisted locally, and
// can be exported to hand back to the agent. Merged view = seed + your additions.

import { readJSON, writeJSON, readString, writeString } from './persist.js';

function mergeById(primary, secondary) {
  const seen = new Set();
  const out = [];
  for (const item of [...primary, ...secondary]) {
    if (!item || seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

/** @param {{seed: Record<string, object[]>, firstModule?: string}} config */
export function createStore({ seed = {}, firstModule = 'overview' }) {
  const listeners = new Set();
  const userAdded = readJSON('userData', {}); // { sliceName: [items] }

  const data = {};
  for (const [slice, items] of Object.entries(seed)) {
    data[slice] = mergeById(userAdded[slice] ?? [], items);
  }

  const state = {
    ui: {
      theme: loadTheme(),
      activeModule: firstModule,
    },
    saved: new Set(readJSON('saved', [])),
    data,
  };

  const notify = () => listeners.forEach((fn) => fn(state));
  const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
  const getState = () => state;

  const getSlice = (slice) => state.data[slice] ?? [];

  // ── routing + theme ─────────────────────────────────────────────────────────
  function setActiveModule(id) {
    if (state.ui.activeModule === id) return;
    state.ui.activeModule = id;
    notify();
  }

  function setTheme(theme) {
    state.ui.theme = theme === 'light' ? 'light' : 'dark';
    writeString('theme', state.ui.theme);
    notify();
  }
  const toggleTheme = () => setTheme(state.ui.theme === 'dark' ? 'light' : 'dark');

  // ── bookmarks (cross-module) ────────────────────────────────────────────────
  const isSaved = (id) => state.saved.has(id);
  function toggleSaved(id) {
    if (state.saved.has(id)) state.saved.delete(id); else state.saved.add(id);
    writeJSON('saved', [...state.saved]);
    notify();
  }
  /** All saved items across every slice, as {slice, item}. */
  function getSaved() {
    const out = [];
    for (const [slice, items] of Object.entries(state.data)) {
      for (const item of items) if (state.saved.has(item.id)) out.push({ slice, item });
    }
    return out;
  }

  // ── adding items (your local additions) ─────────────────────────────────────
  function addItem(slice, item) {
    if (!state.data[slice]) state.data[slice] = [];
    state.data[slice] = mergeById([item], state.data[slice]);
    userAdded[slice] = mergeById([item], userAdded[slice] ?? []);
    writeJSON('userData', userAdded);
    notify();
    return item;
  }

  function removeUserItem(slice, id) {
    userAdded[slice] = (userAdded[slice] ?? []).filter((i) => i.id !== id);
    state.data[slice] = (state.data[slice] ?? []).filter((i) => i.id !== id);
    writeJSON('userData', userAdded);
    notify();
  }

  // ── export / import (the bridge to the agent) ───────────────────────────────
  function exportData() {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      theme: state.ui.theme,
      saved: [...state.saved],
      userData: userAdded,
    }, null, 2);
  }

  function importData(json) {
    const parsed = typeof json === 'string' ? JSON.parse(json) : json;
    if (parsed.userData) {
      for (const [slice, items] of Object.entries(parsed.userData)) {
        userAdded[slice] = mergeById(items, userAdded[slice] ?? []);
        state.data[slice] = mergeById(userAdded[slice], state.data[slice] ?? []);
      }
      writeJSON('userData', userAdded);
    }
    if (Array.isArray(parsed.saved)) {
      parsed.saved.forEach((id) => state.saved.add(id));
      writeJSON('saved', [...state.saved]);
    }
    notify();
  }

  return {
    subscribe, getState, getSlice,
    setActiveModule, setTheme, toggleTheme,
    isSaved, toggleSaved, getSaved,
    addItem, removeUserItem, exportData, importData,
  };
}

function loadTheme() {
  const stored = readString('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  const prefersLight = typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: light)').matches;
  return prefersLight ? 'light' : 'dark';
}
