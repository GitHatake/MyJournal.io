// Timeline Component

import { FC, useState } from 'react';
import { Task, MOOD_EMOJIS, formatTime, formatDuration } from '../types/event';
import './Timeline.css';

interface TimelineProps {
    tasks: Task[];
}

export const Timeline: FC<TimelineProps> = ({ tasks }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const completedTasks = tasks.filter(t => !t.isActive);

    if (completedTasks.length === 0) {
        return (
            <div className="timeline-empty">
                <div className="empty-icon">📋</div>
                <p>まだ完了したタスクはありません</p>
            </div>
        );
    }

    return (
        <div className="timeline">
            <button
                className="timeline-toggle"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
            >
                <h2 className="section-title">
                    📊 今日のタイムライン
                    <span className="toggle-count">({completedTasks.length}件)</span>
                </h2>
                <span className={`toggle-icon ${isExpanded ? 'expanded' : ''}`}>
                    ▼
                </span>
            </button>

            {isExpanded && (
                <div className="timeline-list animate-slideUp">
                    {completedTasks.map((task, index) => (
                        <div
                            key={task.eventId}
                            className="timeline-item"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="timeline-marker">
                                <div className="timeline-dot"></div>
                                {index < completedTasks.length - 1 && <div className="timeline-line"></div>}
                            </div>

                            <div className="timeline-content card">
                                <div className="timeline-header">
                                    <h3 className="timeline-task-name">{task.activityName}</h3>
                                    {task.moodScore && (
                                        <span className="timeline-mood">{MOOD_EMOJIS[task.moodScore]}</span>
                                    )}
                                </div>

                                <div className="timeline-time">
                                    {formatTime(task.startTime)} - {task.endTime && formatTime(task.endTime)}
                                    {task.duration && (
                                        <span className="timeline-duration">({formatDuration(task.duration)})</span>
                                    )}
                                </div>

                                {task.tags.length > 0 && (
                                    <div className="timeline-tags">
                                        {task.tags.map(tag => (
                                            <span key={tag} className="tag">{tag}</span>
                                        ))}
                                    </div>
                                )}

                                {task.description && (
                                    <p className="timeline-description">{task.description}</p>
                                )}

                                {task.progress !== undefined && task.progress < 100 && (
                                    <div className="timeline-progress">
                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill"
                                                style={{ width: `${task.progress}%` }}
                                            ></div>
                                        </div>
                                        <span className="progress-text">{task.progress}%</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
