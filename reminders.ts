/**
 * Reminders — provided by the platform. Do not edit; changes are overwritten.
 *
 * One call works everywhere:
 * - Installed Android app (APK): scheduled NATIVELY (AlarmManager via the
 *   LocalNotifications plugin) — fires on time even with the app fully
 *   closed. The platform's APK build detects this file and wires the plugin
 *   and the POST_NOTIFICATIONS permission automatically.
 * - Browser / preview / PWA: falls back to web notifications + in-page
 *   timers — fires only while the app is open. Timers survive a reload
 *   (re-armed from localStorage when the app starts), not a closed tab.
 *   Be honest about this in your UI: «در نسخهٔ نصب‌شده (APK)، یادآورها حتی
 *   وقتی برنامه بسته است پخش می‌شوند؛ در مرورگر فقط تا وقتی برنامه باز است.»
 *
 *   await requestReminderPermission();                    // once, from a user tap
 *   await scheduleReminder({ id: 1, title: 'ورزش', at: when, repeats: 'daily' });
 *   await cancelReminder(1);
 */

export interface ReminderOptions {
  /** Stable positive integer — schedule with the same id to replace, use it to cancel. */
  id: number;
  title: string;
  body?: string;
  /** When to fire (first fire, when repeating). */
  at: Date;
  repeats?: 'daily' | 'weekly' | null;
}

interface NativeLocalNotifications {
  requestPermissions(): Promise<{ display: string }>;
  schedule(opts: { notifications: unknown[] }): Promise<unknown>;
  cancel(opts: { notifications: Array<{ id: number }> }): Promise<unknown>;
  getPending(): Promise<{ notifications: Array<{ id: number }> }>;
}

function nativePlugin(): NativeLocalNotifications | null {
  const cap = (globalThis as Record<string, any>).Capacitor;
  if (!cap?.isNativePlatform?.()) return null;
  return (cap.Plugins?.LocalNotifications as NativeLocalNotifications) ?? null;
}

/** True inside the installed APK, where reminders fire even when the app is closed. */
export function remindersAreNative(): boolean {
  return nativePlugin() !== null;
}

/** Ask for permission. Call from a user gesture (button tap), not on page load. */
export async function requestReminderPermission(): Promise<boolean> {
  const native = nativePlugin();
  if (native) {
    const { display } = await native.requestPermissions();
    return display === 'granted';
  }
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  return (await Notification.requestPermission()) === 'granted';
}

const STORE_KEY = '__platform_reminders_v1';
type StoredReminder = { id: number; title: string; body?: string; at: number; repeats?: 'daily' | 'weekly' | null };
const webTimers = new Map<number, ReturnType<typeof setTimeout>>();

function readStore(): StoredReminder[] {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch { return []; }
}
function writeStore(items: StoredReminder[]): void {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(items)); } catch { /* storage full */ }
}

const DAY_MS = 24 * 60 * 60 * 1000;

function armWebTimer(r: StoredReminder): void {
  const existing = webTimers.get(r.id);
  if (existing) clearTimeout(existing);
  let fireAt = r.at;
  // A repeating reminder whose time already passed rolls forward; a one-shot
  // that passed while the page was closed fires immediately (better late
  // than silently never).
  const period = r.repeats === 'daily' ? DAY_MS : r.repeats === 'weekly' ? 7 * DAY_MS : 0;
  if (period > 0) while (fireAt <= Date.now()) fireAt += period;
  webTimers.set(r.id, setTimeout(() => {
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(r.title, { body: r.body, tag: String(r.id) });
      }
    } catch { /* notification blocked */ }
    if (period > 0) {
      armWebTimer({ ...r, at: fireAt + period });
    } else {
      writeStore(readStore().filter((s) => s.id !== r.id));
      webTimers.delete(r.id);
    }
  }, Math.max(0, fireAt - Date.now())));
}

// Re-arm web timers when the app starts (no-op inside the APK).
if (typeof window !== 'undefined' && !nativePlugin()) {
  for (const r of readStore()) armWebTimer(r);
}

/** Schedule (or replace, by id). Returns whether it was scheduled natively. */
export async function scheduleReminder(opts: ReminderOptions): Promise<{ native: boolean }> {
  const native = nativePlugin();
  if (native) {
    await native.schedule({
      notifications: [{
        id: opts.id,
        title: opts.title,
        body: opts.body ?? '',
        schedule: {
          at: opts.at,
          allowWhileIdle: true,
          ...(opts.repeats === 'daily' ? { every: 'day' } : opts.repeats === 'weekly' ? { every: 'week' } : {}),
        },
      }],
    });
    return { native: true };
  }
  const stored: StoredReminder = { id: opts.id, title: opts.title, body: opts.body, at: opts.at.getTime(), repeats: opts.repeats ?? null };
  writeStore([...readStore().filter((s) => s.id !== opts.id), stored]);
  armWebTimer(stored);
  return { native: false };
}

export async function cancelReminder(id: number): Promise<void> {
  const native = nativePlugin();
  if (native) {
    await native.cancel({ notifications: [{ id }] });
    return;
  }
  const t = webTimers.get(id);
  if (t) clearTimeout(t);
  webTimers.delete(id);
  writeStore(readStore().filter((s) => s.id !== id));
}

/** Ids of reminders still scheduled. */
export async function listReminderIds(): Promise<number[]> {
  const native = nativePlugin();
  if (native) {
    const { notifications } = await native.getPending();
    return notifications.map((n) => n.id);
  }
  return readStore().map((s) => s.id);
}
