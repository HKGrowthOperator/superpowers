// Minimal DOM helpers. `el` builds elements safely (text is set via
// textContent, never innerHTML) to avoid injection from data fields.

/**
 * @param {string} tag
 * @param {Object} [attrs]   className, dataset, on* handlers, or attributes.
 * @param {(Node|string|null|undefined)[]} [children]
 */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === 'class') node.className = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (k === 'html') {
      node.innerHTML = v; // only used with app-controlled, non-user strings
    } else {
      node.setAttribute(k, v);
    }
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

/** Convenience: a styled chip/badge. */
export function chip(text, variant) {
  return el('span', { class: `chip${variant ? ` chip--${variant}` : ''}` }, [String(text)]);
}

/** Clear and replace the children of a container. */
export function mount(container, ...nodes) {
  container.replaceChildren(...nodes.flat().filter(Boolean));
}
