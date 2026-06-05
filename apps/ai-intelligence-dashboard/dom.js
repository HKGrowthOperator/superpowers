// dom.js — tiny DOM helpers. Security rule: NEVER render data via innerHTML.
// Use el() / textContent for anything that contains source/user/update data.

/**
 * Create an element.
 * @param {string} tag
 * @param {object} [props]  class | dataset | text | on<Event> | aria-* | href ...
 * @param {(Node|string|false|null|Array)} [children]
 */
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value; // safe: text only
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'href' || key === 'type' || key === 'role' || key.startsWith('aria-')) {
      node.setAttribute(key, value);
    } else if (key in node) {
      node[key] = value;
    } else {
      node.setAttribute(key, value);
    }
  }

  appendChildren(node, children);
  return node;
}

function appendChildren(node, children) {
  for (const child of Array.isArray(children) ? children : [children]) {
    if (child == null || child === false || child === '') continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

/** Remove every child of `node`. */
export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

/** Append nodes (ignoring falsy) to a parent. */
export function mount(parent, ...nodes) {
  parent.append(...nodes.filter(Boolean));
  return parent;
}

/**
 * The `html` escape hatch — ONLY for app-controlled CONSTANT strings
 * (e.g. inline SVG icons defined in this codebase). NEVER pass data,
 * source content, or anything a user/source can influence.
 * @param {string} constString
 * @returns {DocumentFragment}
 */
export function html(constString) {
  const template = document.createElement('template');
  template.innerHTML = constString; // constants only — see security rules
  return template.content.cloneNode(true);
}
