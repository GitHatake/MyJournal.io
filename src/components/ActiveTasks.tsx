// Active Tasks Component

import { FC, useState } from 'react';
import { Task, MOOD_EMOJIS, formatTime } from '../types/event';
import './ActiveTasks.css';

interface ActiveTasksProps {
    tasks: Task[];
    onEndTask: (eventId: string, description?: string, moodScore?: number, progress?: number) => Promise<void>;
}

interface EndTaskModalProps {
    task: Task;
    onClose: () => void;
    onSubmit: (description: string, moodScore: number, progress: number) => void;
    isSubmitting: boolean;
}

const EndTaskModal: FC<EndTaskModalProps> = ({ task, onClose, onSubmit, isSubmitting }) => {
    const [description, setDescription] = useState('');
    const [moodScore, setMoodScore] = useState(3);
    const [progress, setProgress] = useState(100);

    const handleSubmit = () => {
        onSubmit(description, moodScore, progress);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content card animate-slideUp" onClick={(e) => e.stopPropagation()}>
                <h3 className="modal-title">タスクを終了</h3>
                <p className="modal-task-name">{task.activityName}</p>
                <p className="modal-start-time">開始: {formatTime(task.startTime)}</p>

                <div className="modal-field">
                    <label>メモ/振り返り</label>
                    <textarea
                        className="input"
                        placeholder="何をしましたか？"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                    />
                </div>

                <div className="modal-field">
                    <label>気分</label>
                    <div className="mood-selector">
                        {[1, 2, 3, 4, 5].map((score) => (
                            <button
                                key={score}
                                className={`mood-btn ${moodScore === score ? 'active' : ''}`}
                                onClick={() => setMoodScore(score)}
                            >
                                {MOOD_EMOJIS[score]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="modal-field">
                    <label>進捗: {progress}%</label>
                    <input
                        type="range"
                        className="progress-slider"
                        min="0"
                        max="100"
                        step="10"
                        value={progress}
                        onChange={(e) => setProgress(parseInt(e.target.value))}
                    />
                </div>

                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onClose}>
                        キャンセル
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <span className="spinner"></span> : '⏹️ 終了'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ActiveTasks: FC<ActiveTasksProps> = ({ tasks, onEndTask }) => {
    const [endingTask, setEndingTask] = useState<Task | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleEndSubmit = async (description: string, moodScore: number, progress: number) => {
        if (!endingTask) return;

        setIsSubmitting(true);
        try {
            await onEndTask(endingTask.eventId, description, moodScore, progress);
            setEndingTask(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (tasks.length === 0) {
        return null;
    }

    return (
        <>
            <div className="active-tasks">
                <h2 className="section-title">
                    <span className="pulse-dot"></span>
                    進行中のタスク
                </h2>

                <div className="active-tasks-list">
                    {tasks.map((task) => (
                        <div key={task.eventId} className="active-task-card card">
                            <div className="task-info">
                                <h3 className="task-name">{task.activityName}</h3>
                                <div className="task-meta">
                                    <span className="task-time">
                                        🕐 {formatTime(task.startTime)} 〜
                                    </span>
                                    {task.tags.length > 0 && (
                                        <div className="task-tags">
                                            {task.tags.map(tag => (
                                                <span key={tag} className="tag">{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                className="btn btn-primary btn-icon end-task-btn"
                                onClick={() => setEndingTask(task)}
                            >
                                ⏹️
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {endingTask && (
                <EndTaskModal
                    task={endingTask}
                    onClose={() => setEndingTask(null)}
                    onSubmit={handleEndSubmit}
                    isSubmitting={isSubmitting}
                />
            )}
        </>
    );
};
