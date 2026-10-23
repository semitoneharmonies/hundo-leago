import { appRegistration } from "./installClient.js";

function applicationKey(value) {
  return Uint8Array.from(atob(value.replaceAll("-", "+").replaceAll("_", "/")), char => char.charCodeAt(0));
}

export async function enablePushNotifications(client, publicKey, isCurrent = () => true) {
  const assertCurrent = () => { if (!isCurrent()) throw new Error("The signed-in session changed."); };
  assertCurrent();
  // Keep this first await: iOS requires permission directly from the user's tap.
  const permission = await Notification.requestPermission();
  assertCurrent();
  if (permission !== "granted") return { enabled: false, permission, message: permission === "denied"
    ? "Notifications are blocked. Allow them in your browser or phone settings."
    : "Notifications weren’t enabled. You can try again." };
  const registration = await appRegistration();
  await navigator.serviceWorker.ready;
  assertCurrent();
  let subscription = await registration.pushManager.getSubscription();
  assertCurrent();
  if (subscription) {
    const current = new Uint8Array(subscription.options?.applicationServerKey || []);
    const expected = applicationKey(publicKey);
    if (current.length !== expected.length || current.some((value, index) => value !== expected[index])) {
      await subscription.unsubscribe();
      assertCurrent();
      subscription = null;
    }
  }
  subscription ||= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationKey(publicKey) });
  assertCurrent();
  await client.request("/api/v1/push/subscriptions", {
    authenticated: true, dataKind: "object", method: "POST", body: { subscription: subscription.toJSON() },
  });
  assertCurrent();
  return { enabled: true, message: "Notifications enabled on this device." };
}
