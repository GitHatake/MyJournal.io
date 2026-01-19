// Vertical Timeline Component (Google Calendar Style)

import { FC, useState } from 'react';
import { Task, formatTime, formatDuration } from '../types/event';
import './VerticalTimeline.css';

interface VerticalTimelineProps {
    tasks: Task[];
    title?: string;
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

export const VerticalTimeline: FC<VerticalTimelineProps> = ({ tasks, title }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    // Filter completed tasks only
    const completedTasks = tasks.filter(t => !t.isActive && t.endTime);

    if (completedTasks.length === 0) {
        return null;
    }

    // Find time range
    const startTimes = completedTasks.map(t => t.startTime.getHours());
    const endTimes = completedTasks.map(t => t.endTime!.getHours() + 1);

    const minHour = Math.max(0, Math.min(...startTimes));
    const maxHour = Math.min(24, Math.max(...endTimes));

    // Generate hour labels
    const hours: number[] = [];
    for (let h = minHour; h <= maxHour; h++) {
        hours.push(h);
    }

    const totalHours = maxHour - minHour;
    const hourHeight = 60; // pixels per hour

    // Calculate position for each task
    const taskBlocks = completedTasks.map((task, index) => {
        const startHour = task.startTime.getHours() + task.startTime.getMinutes() / 60;
        const endHour = task.endTime!.getHours() + task.endTime!.getMinutes() / 60;

        const top = (startHour - minHour) * hourHeight;
        const height = Math.max((endHour - startHour) * hourHeight, 30); // Min 30px
        const color = TASK_COLORS[index % TASK_COLORS.length];

        return { task, top, height, color };
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
                            {taskBlocks.map(({ task, top, height, color }) => (
                                <div
                                    key={task.eventId}
                                    className="vt-task"
                                    style={{
                                        top: `${top}px`,
                                        height: `${height}px`,
                                        backgroundColor: color,
                                        borderLeftColor: color
                                    }}
                                >
                                    <div className="vt-task-name">{task.activityName}</div>
                                    <div className="vt-task-time">
                                        {formatTime(task.startTime)} - {formatTime(task.endTime!)}
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
