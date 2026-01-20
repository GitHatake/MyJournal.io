// Google Drive API Service

import { getAccessToken } from './auth';
import { DailyJournal, JournalEvent, getTodayDateString } from '../types/event';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
const APP_FOLDER_NAME = 'MyJournal.io';

// Get or create app folder
let appFolderId: string | null = null;

const getAuthHeaders = (): HeadersInit => {
    const token = getAccessToken();
    if (!token) throw new Error('Not authenticated');
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

// Find or create app folder
export const getAppFolder = async (): Promise<string> => {
    if (appFolderId) return appFolderId;

    const token = getAccessToken();
    if (!token) throw new Error('Not authenticated');

    // Search for existing folder
    const query = `name='${APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const searchUrl = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;

    const searchRes = await fetch(searchUrl, { headers: getAuthHeaders() });
    const searchData = await searchRes.json();

    if (searchData.files && searchData.files.length > 0) {
        appFolderId = searchData.files[0].id;
        return appFolderId!;
    }

    // Create new folder
    const createRes = await fetch(`${DRIVE_API_BASE}/files`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            name: APP_FOLDER_NAME,
            mimeType: 'application/vnd.google-apps.folder'
        })
    });

    const createData = await createRes.json();
    appFolderId = createData.id;
    return appFolderId!;
};

// Get file ID for a specific date
const getFileId = async (date: string): Promise<string | null> => {
    const folderId = await getAppFolder();
    const fileName = `${date}.json`;
    const query = `name='${fileName}' and '${folderId}' in parents and trashed=false`;
    const url = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;

    const res = await fetch(url, { headers: getAuthHeaders() });
    const data = await res.json();

    return data.files && data.files.length > 0 ? data.files[0].id : null;
};

// Load journal for a specific date
export const loadJournal = async (date: string = getTodayDateString()): Promise<DailyJournal> => {
    console.log('[loadJournal] Loading date:', date);

    const fileId = await getFileId(date);
    console.log('[loadJournal] File ID for', date, ':', fileId);

    if (!fileId) {
        // Return empty journal if file doesn't exist
        console.log('[loadJournal] No file found for', date);
        return { date, events: [] };
    }

    const url = `${DRIVE_API_BASE}/files/${fileId}?alt=media`;
    const res = await fetch(url, { headers: getAuthHeaders() });

    if (!res.ok) {
        console.error('[loadJournal] Failed to load journal:', res.status);
        return { date, events: [] };
    }

    const data = await res.json();
    console.log('[loadJournal] Raw data for', date, ':', JSON.stringify(data));
    console.log('[loadJournal] data.events:', data.events);
    console.log('[loadJournal] data.events length:', data.events ? data.events.length : 'undefined');

    return { date, events: data.events || data };
};

// Save journal for a specific date
export const saveJournal = async (journal: DailyJournal): Promise<void> => {
    const folderId = await getAppFolder();
    const fileName = `${journal.date}.json`;
    const fileId = await getFileId(journal.date);
    const content = JSON.stringify(journal, null, 2);

    const metadata = {
        name: fileName,
        mimeType: 'application/json',
        ...(fileId ? {} : { parents: [folderId] })
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        content +
        closeDelimiter;

    const url = fileId
        ? `${DRIVE_UPLOAD_BASE}/files/${fileId}?uploadType=multipart&fields=id`
        : `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id`;

    const res = await fetch(url, {
        method: fileId ? 'PATCH' : 'POST',
        headers: {
            Authorization: `Bearer ${getAccessToken()}`,
            'Content-Type': `multipart/related; boundary="${boundary}"`
        },
        body: multipartBody
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(`Failed to save journal: ${error.error?.message || res.status}`);
    }
};

// Append event to today's journal
export const appendEvent = async (event: JournalEvent): Promise<void> => {
    const today = getTodayDateString();
    const journal = await loadJournal(today);
    journal.events.push(event);
    await saveJournal(journal);
};

// Get all journal dates (for history)
export const getAllJournalDates = async (): Promise<string[]> => {
    const folderId = await getAppFolder();
    const query = `'${folderId}' in parents and mimeType='application/json' and trashed=false`;
    const url = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(name)&orderBy=name desc`;

    const res = await fetch(url, { headers: getAuthHeaders() });
    const data = await res.json();

    return (data.files || [])
        .map((f: { name: string }) => f.name.replace('.json', ''))
        .filter((name: string) => /^\d{4}-\d{2}-\d{2}$/.test(name));
};

// Get all used tags (for suggestions)
export const getAllTags = async (): Promise<Map<string, number>> => {
    const dates = await getAllJournalDates();
    const tagCounts = new Map<string, number>();

    // Load last 30 days for performance
    const recentDates = dates.slice(0, 30);

    for (const date of recentDates) {
        const journal = await loadJournal(date);
        for (const event of journal.events) {
            if ('tags' in event && event.tags) {
                for (const tag of event.tags) {
                    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
                }
            }
        }
    }

    return tagCounts;
};
