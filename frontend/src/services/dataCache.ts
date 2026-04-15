/**
 * Module-level in-memory cache for data that is expensive to fetch.
 * Survives tab switches within the extension (components unmount/remount
 * but the module stays alive), so pages can render immediately with
 * previously-fetched data while a background sync runs.
 *
 * The cache is intentionally NOT persisted to localStorage — it is just
 * a lightweight session cache that vanishes when the extension panel closes.
 */

import type { ProcessedEmail, DraftEmail, EmailTaskItem, EmailEventItem, GoogleCalendarEvent } from "./api";

let _emails: ProcessedEmail[] | null = null;
let _drafts: DraftEmail[] | null = null;
let _emailItems: EmailTaskItem[] | null = null;
let _emailEvents: EmailEventItem[] | null = null;
let _gcalEvents: GoogleCalendarEvent[] | null = null;

export const getCachedEmails = (): ProcessedEmail[] | null => _emails;
export const setCachedEmails = (emails: ProcessedEmail[]): void => { _emails = emails; };

export const getCachedDrafts = (): DraftEmail[] | null => _drafts;
export const setCachedDrafts = (drafts: DraftEmail[]): void => { _drafts = drafts; };

export const getCachedEmailItems = (): EmailTaskItem[] | null => _emailItems;
export const setCachedEmailItems = (items: EmailTaskItem[]): void => { _emailItems = items; };

export const getCachedEmailEvents = (): EmailEventItem[] | null => _emailEvents;
export const setCachedEmailEvents = (items: EmailEventItem[]): void => { _emailEvents = items; };

export const getCachedGCalEvents = (): GoogleCalendarEvent[] | null => _gcalEvents;
export const setCachedGCalEvents = (items: GoogleCalendarEvent[]): void => { _gcalEvents = items; };

/** Call on logout so cached data from the previous user is not shown to the next. */
export const clearDataCache = (): void => {
  _emails = null;
  _drafts = null;
  _emailItems = null;
  _emailEvents = null;
  _gcalEvents = null;
};
