// Vertical Timeline Component (Google Calendar Style)

import { FC, useState } from 'react';
import { Task, formatTime, formatDuration } from '../types/event';
import './VerticalTimeline.css';

interface VerticalTimelineProps {
    tasks: Task[];
    title?: string;
    onEditTask?: (task: Task) => void;
}

// Color palette for task blocks
const TASK_COLORS = [
    '#6366f1', // Indigo
    '#8b5cf6', // Purple  
    '#a855f7', // Fuchsia
    '#ec4899', // Pink
    '#22c55e', // Green
    '#14b8a6', // Teal
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
];

// Check if task spans multiple days
const isMultiDayTask = (task: Task): boolean => {
    if (!task.endTime) return false;
    const startDate = task.startTime.toDateString();
    const endDate = task.endTime.toDateString();
    return startDate !== endDate;
};

// Get today's date at midnight for comparison
const getTodayMidnight = (): Date => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};

export const VerticalTimeline: FC<VerticalTimelineProps> = ({ tasks, title, onEditTask }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    // Filter completed tasks only
    const completedTasks = tasks.filter(t => !t.isActive && t.endTime);

    if (completedTasks.length === 0) {
        return null;
    }

    const todayMidnight = getTodayMidnight();

    // Process tasks for display (handle multi-day tasks)
    const processedTasks = completedTasks.map(task => {
        const isMultiDay = isMultiDayTask(task);

        // For multi-day tasks that started yesterday and ended today,
        // display from midnight (0:00) to endTime
        let displayStartTime: Date;
        let displayEndTime: Date = task.endTime!;

        if (isMultiDay && task.startTime < todayMidnight) {
            // Task started before today - show from midnight
            displayStartTime = todayMidnight;
        } else {
            displayStartTime = task.startTime;
        }

        return {
            ...task,
            displayStartTime,
            displayEndTime,
            isMultiDay
        };
    });

    // Find time range based on display times
    const startHours = processedTasks.map(t => t.displayStartTime.getHours());
    const endHours = processedTasks.map(t => t.displayEndTime.getHours() + 1);

    const minHour = Math.max(0, Math.min(...startHours));
    const maxHour = Math.min(24, Math.max(...endHours));

    // Generate hour labels
    const hours: number[] = [];
    for (let h = minHour; h <= maxHour; h++) {
        hours.push(h);
    }

    const totalHours = maxHour - minHour;
    const hourHeight = 60; // pixels per hour

    // Layout algorithm for overlapping tasks
    const arrangeTasks = (tasks: typeof processedTasks) => {
        // Sort tasks by start time, then by end time (longer tasks first)
        const sortedTasks = [...tasks].sort((a, b) => {
            if (a.displayStartTime.getTime() !== b.displayStartTime.getTime()) {
                return a.displayStartTime.getTime() - b.displayStartTime.getTime();
            }
            return b.displayEndTime.getTime() - a.displayEndTime.getTime();
        });

        // Calculate visual start and end positions (minutes from minHour)
        const positionedTasks = sortedTasks.map((task, index) => {
            // Convert time to minutes relative to minHour
            const startMinutes = (task.displayStartTime.getHours() - minHour) * 60 + task.displayStartTime.getMinutes();
            const endMinutes = (task.displayEndTime.getHours() - minHour) * 60 + task.displayEndTime.getMinutes();

            return {
                ...task,
                originalIndex: index, // Track original index for stable colors
                startMinutes,
                endMinutes,
                column: 0,
                totalColumns: 1
            };
        });

        // Group overlapping tasks into clusters
        const clusters: (typeof positionedTasks)[] = [];
        if (positionedTasks.length > 0) {
            let currentCluster = [positionedTasks[0]];
            let clusterEnd = positionedTasks[0].endMinutes;

            for (let i = 1; i < positionedTasks.length; i++) {
                const task = positionedTasks[i];
                if (task.startMinutes < clusterEnd) {
                    // Overlaps with current cluster
                    currentCluster.push(task);
                    clusterEnd = Math.max(clusterEnd, task.endMinutes);
                } else {
                    // New cluster
                    clusters.push(currentCluster);
                    currentCluster = [task];
                    clusterEnd = task.endMinutes;
                }
            }
            clusters.push(currentCluster);
        }

        // Process each cluster to assign columns
        clusters.forEach(cluster => {
            // Stores the last task in each column to checking overlapping
            const columns: (typeof positionedTasks)[number][] = [];

            cluster.forEach(task => {
                let placed = false;
                // Try to place in an existing column
                for (let i = 0; i < columns.length; i++) {
                    const lastTaskInColumn = columns[i];
                    if (lastTaskInColumn.endMinutes <= task.startMinutes) {
                        task.column = i;
                        columns[i] = task;
                        placed = true;
                        break;
                    }
                }

                if (!placed) {
                    // Create new column
                    task.column = columns.length;
                    columns.push(task);
                }
            });

            // Update totalColumns for all tasks in this cluster
            const totalColumns = columns.length;
            cluster.forEach(task => {
                task.totalColumns = totalColumns;
            });

            // Optional: Expand tasks to fill empty space to the right if possible
            // This is a more advanced "tetris-like" packing, but simple equal width is safer for now
        });

        return positionedTasks;
    };

    const arrangedTasks = arrangeTasks(processedTasks);

    // Calculate rendering styles
    const taskBlocks = arrangedTasks.map((task) => {
        const top = (task.startMinutes / 60) * hourHeight;
        const height = Math.max((task.endMinutes - task.startMinutes) / 60 * hourHeight, 30); // Min 30px

        // Calculate width and left position based on columns
        // Use percentage for width to be responsive
        const widthPercent = 100 / task.totalColumns;
        const leftPercent = task.column * widthPercent;

        // Add a small gap between columns if there are multiple
        const gap = task.totalColumns > 1 ? 2 : 0;

        // Use processedTasks index for color consistency with original list order if needed, 
        // or just use the current iteration order. Let's use the original task ID or something stable.
        // For simplicity, we'll use a hash of eventId for consistent colors, or just rotate based on index
        // But since we sorted, index changed. Let's use a stable index approach or processedTasks.indexOf
        const originalIndex = processedTasks.findIndex(t => t.eventId === task.eventId);
        const color = TASK_COLORS[originalIndex % TASK_COLORS.length];

        return { task, top, height, color, leftPercent, widthPercent, gap };
    });

    return (
        <div className="vertical-timeline card">
            <button
                className="vt-toggle"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
            >
                <h3 className="vt-title">{title || '📅 タイムライン'}</h3>
                <span className={`toggle-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
            </button>

            {isExpanded && (
                <div className="vt-content">
                    <div
                        className="vt-grid"
                        style={{ height: `${totalHours * hourHeight}px` }}
                    >
                        {/* Hour labels */}
                        <div className="vt-hours">
                            {hours.map(hour => (
                                <div
                                    key={hour}
                                    className="vt-hour"
                                    style={{ top: `${(hour - minHour) * hourHeight}px` }}
                                >
                                    {String(hour).padStart(2, '0')}:00
                                </div>
                            ))}
                        </div>

                        {/* Hour grid lines */}
                        <div className="vt-grid-lines">
                            {hours.map(hour => (
                                <div
                                    key={hour}
                                    className="vt-grid-line"
                                    style={{ top: `${(hour - minHour) * hourHeight}px` }}
                                />
                            ))}
                        </div>

                        {/* Task blocks */}
                        <div className="vt-tasks">
                            {taskBlocks.map(({ task, top, height, color, leftPercent, widthPercent, gap }) => (
                                <div
                                    key={task.eventId}
                                    className={`vt-task ${task.isMultiDay ? 'vt-task-multiday' : ''} ${onEditTask ? 'vt-task-editable' : ''}`}
                                    style={{
                                        top: `${top}px`,
                                        height: `${height}px`,
                                        left: `calc(${leftPercent}% + ${gap}px)`,
                                        width: `calc(${widthPercent}% - ${gap * 2}px)`,
                                        backgroundColor: color,
                                        borderLeftColor: color
                                    }}
                                    onClick={() => onEditTask && onEditTask(task)}
                                >
                                    <div className="vt-task-name">
                                        {task.isMultiDay && '🌙 '}
                                        {task.activityName}
                                    </div>
                                    <div className="vt-task-time">
                                        {task.isMultiDay ? '(前日から) ' : ''}
                                        {formatTime(task.displayStartTime)} - {formatTime(task.displayEndTime)}
                                        {task.duration && ` (${formatDuration(task.duration)})`}
                                    </div>
                                    {task.tags.length > 0 && (
                                        <div className="vt-task-tags">
                                            {task.tags.slice(0, 2).map(tag => (
                                                <span key={tag} className="vt-tag">{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
