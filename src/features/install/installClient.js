let installPrompt = null;
let registrationPromise = null;
const listeners = new Set();
function changed() { listeners.forEach((listener) => listener()); }
export function startInstallSupport() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault(); installPrompt = event; changed();
  });
  window.addEventListener("appinstalled", () => { installPrompt = null; changed(); });
  if (import.meta.env.PROD && "serviceWorker" in navigator && window.isSecureContext) {
    registrationPromise = navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
    registrationPromise.catch(() => {});
  }
}
export function watchInstall(listener) { listeners.add(listener); return () => listeners.delete(listener); }
export function canInstall() { return installPrompt !== null; }
export function isInstalled() { return window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true; }
export async function requestInstall() {
  if (!installPrompt) return;
  const prompt = installPrompt; installPrompt = null; changed();
  await prompt.prompt(); return prompt.userChoice;
}
export async function appRegistration() {
  if (!registrationPromise) throw new Error("Install support is unavailable. Open the published app over HTTPS.");
  return registrationPromise;
}
