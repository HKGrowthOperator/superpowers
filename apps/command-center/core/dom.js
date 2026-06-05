// core/dom.js — safe DOM helpers. Security rule: NEVER render data via innerHTML.
// Use el()/textContent for anything containing data. html() is constants-only.

export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
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
  for (const child of Array.isArray(children) ? children : [children]) {
    if (child == null || child === false || child === '') continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

export function mount(parent, ...nodes) {
  parent.append(...nodes.filter(Boolean));
  return parent;
}

/** Constants-only escape hatch (e.g. inline SVG icons). Never pass data. */
export function html(constString) {
  const template = document.createElement('template');
  template.innerHTML = constString;
  return template.content.cloneNode(true);
}
