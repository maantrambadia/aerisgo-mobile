let listeners = new Set();
let nextId = 1;

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
  const payload = {
    id,
    type: options.type || "info", // success | error | info | warning
    title: options.title || "",
    message: options.message || "",
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
