// Mock Source adapter — serves bundled seed data through the same Source
// interface a live adapter would use. This is the ONLY source wired in by
// default. See README.md ("Connecting real sources") to add live adapters.

import { seedUpdates } from '../seed/updates.js';

/** @type {import('./adapter.js').Source} */
export const mockSource = {
  id: 'mock',
  name: 'Seed data (sample)',
  async fetchUpdates() {
    // Simulate async I/O so the UI exercises its loading state.
    await new Promise((r) => setTimeout(r, 150));
    return seedUpdates.map((u) => ({ ...u }));
  },
};

// ---------------------------------------------------------------------
// Template for a future live adapter. Copy, implement fetch + mapping,
// and register it in main.js alongside (or instead of) mockSource.
// ---------------------------------------------------------------------
//
// export function createRssSource(name, url) {
//   return {
//     id: `rss:${url}`,
//     name,
//     async fetchUpdates() {
//       const res = await fetch(url);          // or via a backend proxy
//       const xml = await res.text();
//       return parseRssToUpdates(xml);          // map feed items -> AIUpdate
//     },
//   };
// }
