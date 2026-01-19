// Event Types for MyJournal.io

export type EventType = 'START' | 'END' | 'MEMO';

export interface StartEvent {
    eventId: string;
    type: 'START';
    timestamp: string;
    activityName: string;
    tags: string[];
}

export interface EndEvent {
    refEventId: string;
    type: 'END';
    timestamp: string;
    description?: string;
    moodScore?: number; // 1-5
    progress?: number; // 0-100
}

export interface MemoEvent {
    eventId: string;
    type: 'MEMO';
    timestamp: string;
    content: string;
}

export type JournalEvent = StartEvent | EndEvent | MemoEvent;

// Computed task from START + END pair
export interface Task {
    eventId: string;
    activityName: string;
    tags: string[];
    startTime: Date;
    endTime?: Date;
    duration?: number; // in minutes
    description?: string;
    moodScore?: number;
    progress?: number;
    isActive: boolean;
}

// Daily journal data
export interface DailyJournal {
    date: string; // YYYY-MM-DD
    events: JournalEvent[];
}

// Tag suggestion
export interface TagSuggestion {
    name: string;
    count: number;
    lastUsed: string;
}

// Mood emoji mapping
export const MOOD_EMOJIS: Record<number, string> = {
    1: '😞',
    2: '😕',
    3: '😐',
    4: '🙂',
    5: '😄'
};

// Generate UUID
export const generateEventId = (): string => {
    return crypto.randomUUID();
};

// Helper to get JST date object (shifted by +9h from UTC)
const getJSTDate = (date: Date = new Date()): Date => {
    return new Date(date.getTime() + 9 * 60 * 60 * 1000);
};

// Format timestamp (JST timezone: +09:00)
export const formatTimestamp = (date: Date = new Date()): string => {
    const jst = getJSTDate(date);
    const year = jst.getUTCFullYear();
    const month = String(jst.getUTCMonth() + 1).padStart(2, '0');
    const day = String(jst.getUTCDate()).padStart(2, '0');
    const hours = String(jst.getUTCHours()).padStart(2, '0');
    const minutes = String(jst.getUTCMinutes()).padStart(2, '0');
    const seconds = String(jst.getUTCSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+09:00`;
};

// Parse timestamp
export const parseTimestamp = (timestamp: string): Date => {
    return new Date(timestamp);
};

// Calculate duration in minutes
export const calculateDuration = (start: Date, end: Date): number => {
    return Math.round((end.getTime() - start.getTime()) / 60000);
};

// Format duration for display
export const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
        return `${minutes}分`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}時間${mins}分` : `${hours}時間`;
};

// Get today's date string (JST)
export const getTodayDateString = (): string => {
    const jst = getJSTDate(new Date());
    const year = jst.getUTCFullYear();
    const month = String(jst.getUTCMonth() + 1).padStart(2, '0');
    const day = String(jst.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Format time for display (HH:MM)
export const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
};
