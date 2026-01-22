let listeners = new Set();
let nextId = 1;

function normalizeWhitespace(text) {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function toSentenceCase(text) {
  const t = normalizeWhitespace(text);
  if (!t) return "";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function ensureEndingPunctuation(text) {
  const t = normalizeWhitespace(text);
  if (!t) return "";
  if (/[.!?]$/.test(t)) return t;
  return `${t}.`;
}

function defaultTitleForType(type) {
  if (type === "success") return "Success";
  if (type === "error") return "Something went wrong";
  if (type === "warning") return "Heads up";
  return "Notice";
}

function emit(event) {
  listeners.forEach((l) => {
    try {
      l(event);
    } catch {}
  });
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function show(options = {}) {
  const id = options.id || nextId++;
  const type = options.type || "info";
  const titleInput = toSentenceCase(options.title);
  const messageInput = ensureEndingPunctuation(options.message);

  const payload = {
    id,
    type, // success | error | info | warning
    title: titleInput || (messageInput ? defaultTitleForType(type) : ""),
    message: messageInput,
    duration: Number(options.duration ?? 3000),
    haptics: options.haptics ?? true,
  };
  emit({ kind: "show", toast: payload });
  return id;
}

export function dismiss(id) {
  emit({ kind: "dismiss", id });
}

export const toast = {
  show,
  dismiss,
  success(opts) {
    return show({ ...opts, type: "success" });
  },
  error(opts) {
    return show({ ...opts, type: "error" });
  },
  info(opts) {
    return show({ ...opts, type: "info" });
  },
  warn(opts) {
    return show({ ...opts, type: "warning" });
  },
};
