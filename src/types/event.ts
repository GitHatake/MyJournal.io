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

// Format timestamp with JST timezone indicator
// Uses local system time (assumes user is in Japan/JST timezone)
export const formatTimestamp = (date: Date = new Date()): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
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

// Get today's date string (local timezone, assumed JST)
export const getTodayDateString = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
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
