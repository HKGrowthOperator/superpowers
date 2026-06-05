// core/persist.js — localStorage helpers, all guarded so a blocked/absent
// storage never breaks the app (it just falls back to in-memory defaults).

const KEY = (name) => `cc.${name}`;

export function readJSON(name, fallback) {
  try {
    const raw = localStorage.getItem(KEY(name));
    if (raw == null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(name, value) {
  try {
    localStorage.setItem(KEY(name), JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function readString(name, fallback = null) {
  try {
    const v = localStorage.getItem(KEY(name));
    return v == null ? fallback : v;
  } catch {
    return fallback;
  }
}

export function writeString(name, value) {
  try {
    localStorage.setItem(KEY(name), value);
    return true;
  } catch {
    return false;
  }
}
