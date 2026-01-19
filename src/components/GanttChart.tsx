// Gantt Chart Component for Timeline Visualization

import { FC } from 'react';
import { Task, formatTime } from '../types/event';
import './GanttChart.css';

interface GanttChartProps {
    tasks: Task[];
    title?: string;
}

// Color palette for task bars
const TASK_COLORS = [
    '#6366f1', // Indigo
    '#8b5cf6', // Purple  
    '#a855f7', // Fuchsia
    '#ec4899', // Pink
    '#f43f5e', // Rose
    '#22c55e', // Green
    '#14b8a6', // Teal
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#f59e0b', // Amber
];

export const GanttChart: FC<GanttChartProps> = ({ tasks, title }) => {
    // Filter completed tasks only
    const completedTasks = tasks.filter(t => !t.isActive && t.endTime);

    if (completedTasks.length === 0) {
        return null;
    }

    // Find time range (earliest start to latest end)
    const startTimes = completedTasks.map(t => t.startTime.getTime());
    const endTimes = completedTasks.map(t => t.endTime!.getTime());

    const dayStart = new Date(Math.min(...startTimes));
    dayStart.setMinutes(0, 0, 0); // Round down to hour

    const dayEnd = new Date(Math.max(...endTimes));
    dayEnd.setMinutes(59, 59, 999); // Round up to end of hour

    const totalDuration = dayEnd.getTime() - dayStart.getTime();

    // Generate hour markers
    const hours: number[] = [];
    const startHour = dayStart.getHours();
    const endHour = dayEnd.getHours();
    for (let h = startHour; h <= endHour; h++) {
        hours.push(h);
    }

    // Calculate position and width for each task
    const taskBars = completedTasks.map((task, index) => {
        const left = ((task.startTime.getTime() - dayStart.getTime()) / totalDuration) * 100;
        const width = ((task.endTime!.getTime() - task.startTime.getTime()) / totalDuration) * 100;
        const color = TASK_COLORS[index % TASK_COLORS.length];

        return {
            task,
            left: Math.max(0, left),
            width: Math.max(2, width), // Minimum 2% width for visibility
            color
        };
    });

    return (
        <div className="gantt-chart card">
            {title && <h3 className="gantt-title">{title}</h3>}

            {/* Scrollable timeline container */}
            <div className="gantt-scroll-container">
                <div className="gantt-timeline">
                    {/* Time axis */}
                    <div className="gantt-axis">
                        {hours.map(hour => (
                            <div
                                key={hour}
                                className="gantt-hour"
                                style={{ left: `${((hour - startHour) / (endHour - startHour + 1)) * 100}%` }}
                            >
                                {hour}:00
                            </div>
                        ))}
                    </div>

                    {/* Task bars container */}
                    <div className="gantt-bars-container">
                        {taskBars.map(({ task, left, width, color }) => (
                            <div
                                key={task.eventId}
                                className="gantt-bar"
                                style={{
                                    left: `${left}%`,
                                    width: `${width}%`,
                                    backgroundColor: color
                                }}
                                title={`${task.activityName} (${formatTime(task.startTime)} - ${formatTime(task.endTime!)})`}
                            >
                                <span className="gantt-bar-label">{task.activityName}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Legend - horizontal scrollable */}
            <div className="gantt-legend-wrapper">
                <div className="gantt-legend">
                    {taskBars.map(({ task, color }) => (
                        <div key={task.eventId} className="gantt-legend-item">
                            <span
                                className="gantt-legend-color"
                                style={{ backgroundColor: color }}
                            ></span>
                            <span className="gantt-legend-text">
                                {formatTime(task.startTime)} {task.activityName}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
