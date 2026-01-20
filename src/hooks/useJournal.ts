// Journal Data Hook

import { useState, useEffect, useCallback } from 'react';
import { loadJournal, appendEvent, getAllTags } from '../services/drive';
import {
    DailyJournal,
    JournalEvent,
    StartEvent,
    EndEvent,
    MemoEvent,
    Task,
    getTodayDateString,
    generateEventId,
    formatTimestamp,
    parseTimestamp,
    calculateDuration
} from '../types/event';

// Default tags including sleep
const DEFAULT_TAGS = ['仕事', '学習', '運動', '休憩', '食事', '睡眠', '趣味'];

interface UseJournalReturn {
    journal: DailyJournal | null;
    tasks: Task[];
    activeTasks: Task[];
    availableTags: string[];
    isLoading: boolean;
    error: string | null;
    loadToday: () => Promise<void>;
    loadDate: (date: string) => Promise<void>;
    startTask: (name: string, tags: string[]) => Promise<string>;
    endTask: (eventId: string, description?: string, moodScore?: number, progress?: number) => Promise<void>;
    addMemo: (content: string) => Promise<void>;
    refresh: () => Promise<void>;
}

// Get yesterday's date string (local timezone, assumed JST)
const getYesterdayDateString = (): string => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Convert events to tasks (supports multi-day tasks)
const eventsToTasks = (
    todayEvents: JournalEvent[],
    yesterdayEvents: JournalEvent[] = []
): Task[] => {
    const taskMap = new Map<string, Task>();
    const allEvents = [...yesterdayEvents, ...todayEvents];

    for (const event of allEvents) {
        if (event.type === 'START') {
            const startEvent = event as StartEvent;
            taskMap.set(startEvent.eventId, {
                eventId: startEvent.eventId,
                activityName: startEvent.activityName,
                tags: startEvent.tags,
                startTime: parseTimestamp(startEvent.timestamp),
                isActive: true
            });
        } else if (event.type === 'END') {
            const endEvent = event as EndEvent;
            const task = taskMap.get(endEvent.refEventId);
            if (task) {
                const endTime = parseTimestamp(endEvent.timestamp);
                task.endTime = endTime;
                task.duration = calculateDuration(task.startTime, endTime);
                task.description = endEvent.description;
                task.moodScore = endEvent.moodScore;
                task.progress = endEvent.progress;
                task.isActive = false;
            }
        }
    }

    // Filter: only include tasks that are active OR ended today
    const today = getTodayDateString();
    const filteredTasks = Array.from(taskMap.values()).filter(task => {
        if (task.isActive) return true;
        if (task.endTime) {
            // Use local date format instead of toISOString (which returns UTC)
            const endYear = task.endTime.getFullYear();
            const endMonth = String(task.endTime.getMonth() + 1).padStart(2, '0');
            const endDay = String(task.endTime.getDate()).padStart(2, '0');
            const endDate = `${endYear}-${endMonth}-${endDay}`;
            return endDate === today;
        }
        return false;
    });

    return filteredTasks.sort(
        (a, b) => b.startTime.getTime() - a.startTime.getTime()
    );
};

export const useJournal = (isSignedIn: boolean): UseJournalReturn => {
    const [journal, setJournal] = useState<DailyJournal | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [availableTags, setAvailableTags] = useState<string[]>(DEFAULT_TAGS);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const activeTasks = tasks.filter((t) => t.isActive);

    // Load tags from history
    const loadTags = useCallback(async () => {
        if (!isSignedIn) return;

        try {
            const tagCounts = await getAllTags();
            const sortedTags = Array.from(tagCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([tag]) => tag);

            // Merge with default tags
            const allTags = [...new Set([...sortedTags, ...DEFAULT_TAGS])];
            setAvailableTags(allTags);
        } catch (err) {
            console.error('Failed to load tags:', err);
        }
    }, [isSignedIn]);

    const loadToday = useCallback(async () => {
        if (!isSignedIn) return;
        setIsLoading(true);
        setError(null);

        try {
            // Load today and yesterday for multi-day task support
            const [todayData, yesterdayData] = await Promise.all([
                loadJournal(getTodayDateString()),
                loadJournal(getYesterdayDateString())
            ]);

            setJournal(todayData);
            setTasks(eventsToTasks(todayData.events, yesterdayData.events));
        } catch (err) {
            console.error('Failed to load journal:', err);
            setError('ジャーナルの読み込みに失敗しました');
        } finally {
            setIsLoading(false);
        }
    }, [isSignedIn]);

    const loadDate = useCallback(async (date: string) => {
        if (!isSignedIn) return;
        setIsLoading(true);
        setError(null);

        try {
            const data = await loadJournal(date);
            setJournal(data);
            setTasks(eventsToTasks(data.events));
        } catch (err) {
            console.error('Failed to load journal:', err);
            setError('ジャーナルの読み込みに失敗しました');
        } finally {
            setIsLoading(false);
        }
    }, [isSignedIn]);

    const startTask = useCallback(async (name: string, tags: string[]): Promise<string> => {
        const eventId = generateEventId();
        const event: StartEvent = {
            eventId,
            type: 'START',
            timestamp: formatTimestamp(),
            activityName: name,
            tags
        };

        await appendEvent(event);
        await loadToday();

        // Update available tags with newly used ones
        if (tags.length > 0) {
            setAvailableTags(prev => [...new Set([...tags, ...prev])]);
        }

        return eventId;
    }, [loadToday]);

    const endTask = useCallback(async (
        eventId: string,
        description?: string,
        moodScore?: number,
        progress?: number
    ): Promise<void> => {
        const event: EndEvent = {
            refEventId: eventId,
            type: 'END',
            timestamp: formatTimestamp(),
            description,
            moodScore,
            progress
        };

        await appendEvent(event);
        await loadToday();
    }, [loadToday]);

    const addMemo = useCallback(async (content: string): Promise<void> => {
        const event: MemoEvent = {
            eventId: generateEventId(),
            type: 'MEMO',
            timestamp: formatTimestamp(),
            content
        };

        await appendEvent(event);
        await loadToday();
    }, [loadToday]);

    const refresh = useCallback(async () => {
        await loadToday();
    }, [loadToday]);

    // Auto-load on sign in
    useEffect(() => {
        if (isSignedIn) {
            loadToday();
            loadTags();
        } else {
            setJournal(null);
            setTasks([]);
            setAvailableTags(DEFAULT_TAGS);
        }
    }, [isSignedIn, loadToday, loadTags]);

    return {
        journal,
        tasks,
        activeTasks,
        availableTags,
        isLoading,
        error,
        loadToday,
        loadDate,
        startTask,
        endTask,
        addMemo,
        refresh
    };
};
