// Journal Data Hook

import { useState, useEffect, useCallback } from 'react';
import { loadJournal, appendEvent } from '../services/drive';
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

interface UseJournalReturn {
    journal: DailyJournal | null;
    tasks: Task[];
    activeTasks: Task[];
    isLoading: boolean;
    error: string | null;
    loadToday: () => Promise<void>;
    loadDate: (date: string) => Promise<void>;
    startTask: (name: string, tags: string[]) => Promise<string>;
    endTask: (eventId: string, description?: string, moodScore?: number, progress?: number) => Promise<void>;
    addMemo: (content: string) => Promise<void>;
    refresh: () => Promise<void>;
}

// Convert events to tasks
const eventsToTasks = (events: JournalEvent[]): Task[] => {
    const taskMap = new Map<string, Task>();

    for (const event of events) {
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

    return Array.from(taskMap.values()).sort(
        (a, b) => b.startTime.getTime() - a.startTime.getTime()
    );
};

export const useJournal = (isSignedIn: boolean): UseJournalReturn => {
    const [journal, setJournal] = useState<DailyJournal | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const activeTasks = tasks.filter((t) => t.isActive);

    const loadToday = useCallback(async () => {
        if (!isSignedIn) return;
        setIsLoading(true);
        setError(null);

        try {
            const data = await loadJournal(getTodayDateString());
            setJournal(data);
            setTasks(eventsToTasks(data.events));
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
        } else {
            setJournal(null);
            setTasks([]);
        }
    }, [isSignedIn, loadToday]);

    return {
        journal,
        tasks,
        activeTasks,
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
