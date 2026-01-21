// Task Edit Modal Component

import { FC, useState } from 'react';
import { Task, MOOD_EMOJIS } from '../types/event';
import './TaskEditModal.css';

interface TaskEditModalProps {
    task: Task;
    onClose: () => void;
    onSave: (updates: {
        activityName?: string;
        tags?: string[];
        startTime?: Date;
        endTime?: Date;
        description?: string;
        moodScore?: number;
        progress?: number;
    }) => void;
    onDelete: () => void;
    isSubmitting: boolean;
    suggestedTags: string[];
}

// Format Date to HH:MM string
const formatTimeInput = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};

// Parse HH:MM string to Date (using base date)
const parseTimeInput = (timeStr: string, baseDate: Date): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const result = new Date(baseDate);
    result.setHours(hours, minutes, 0, 0);
    return result;
};

export const TaskEditModal: FC<TaskEditModalProps> = ({
    task,
    onClose,
    onSave,
    onDelete,
    isSubmitting,
    suggestedTags
}) => {
    const [activityName, setActivityName] = useState(task.activityName);
    const [tags, setTags] = useState<string[]>(task.tags);
    const [startTimeStr, setStartTimeStr] = useState(formatTimeInput(task.startTime));
    const [endTimeStr, setEndTimeStr] = useState(task.endTime ? formatTimeInput(task.endTime) : '');
    const [description, setDescription] = useState(task.description || '');
    const [moodScore, setMoodScore] = useState(task.moodScore || 3);
    const [progress, setProgress] = useState(task.progress || 100);
    const [tagInput, setTagInput] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleSave = () => {
        const updates: Parameters<typeof onSave>[0] = {};

        if (activityName !== task.activityName) {
            updates.activityName = activityName;
        }
        if (JSON.stringify(tags) !== JSON.stringify(task.tags)) {
            updates.tags = tags;
        }

        const newStartTime = parseTimeInput(startTimeStr, task.startTime);
        if (newStartTime.getTime() !== task.startTime.getTime()) {
            updates.startTime = newStartTime;
        }

        if (task.endTime && endTimeStr) {
            const newEndTime = parseTimeInput(endTimeStr, task.endTime);
            if (newEndTime.getTime() !== task.endTime.getTime()) {
                updates.endTime = newEndTime;
            }
        }

        if (description !== (task.description || '')) {
            updates.description = description;
        }
        if (moodScore !== (task.moodScore || 3)) {
            updates.moodScore = moodScore;
        }
        if (progress !== (task.progress || 100)) {
            updates.progress = progress;
        }

        onSave(updates);
    };

    const handleAddTag = (tag: string) => {
        if (tag && !tags.includes(tag)) {
            setTags([...tags, tag]);
        }
        setTagInput('');
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleDelete = () => {
        if (showDeleteConfirm) {
            onDelete();
        } else {
            setShowDeleteConfirm(true);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content task-edit-modal card animate-slideUp" onClick={(e) => e.stopPropagation()}>
                <h3 className="modal-title">タスクを編集</h3>

                {/* Task Name */}
                <div className="modal-field">
                    <label>タスク名</label>
                    <input
                        type="text"
                        className="input"
                        value={activityName}
                        onChange={(e) => setActivityName(e.target.value)}
                    />
                </div>

                {/* Tags */}
                <div className="modal-field">
                    <label>タグ</label>
                    <div className="tags-edit-container">
                        <div className="current-tags">
                            {tags.map(tag => (
                                <span key={tag} className="tag editable-tag">
                                    {tag}
                                    <button
                                        className="tag-remove-btn"
                                        onClick={() => handleRemoveTag(tag)}
                                    >×</button>
                                </span>
                            ))}
                        </div>
                        <div className="tag-input-row">
                            <input
                                type="text"
                                className="input tag-input"
                                placeholder="タグを追加..."
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddTag(tagInput);
                                    }
                                }}
                            />
                        </div>
                        <div className="suggested-tags">
                            {suggestedTags.filter(t => !tags.includes(t)).slice(0, 5).map(tag => (
                                <button
                                    key={tag}
                                    className="tag suggested-tag"
                                    onClick={() => handleAddTag(tag)}
                                >
                                    + {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Time */}
                <div className="modal-field time-fields">
                    <div className="time-field">
                        <label>開始時間</label>
                        <input
                            type="time"
                            className="input time-input"
                            value={startTimeStr}
                            onChange={(e) => setStartTimeStr(e.target.value)}
                        />
                    </div>
                    {task.endTime && (
                        <div className="time-field">
                            <label>終了時間</label>
                            <input
                                type="time"
                                className="input time-input"
                                value={endTimeStr}
                                onChange={(e) => setEndTimeStr(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                {/* Description (only for completed tasks) */}
                {!task.isActive && (
                    <>
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
                    </>
                )}

                {/* Actions */}
                <div className="modal-actions">
                    <button
                        className={`btn btn-danger delete-btn ${showDeleteConfirm ? 'confirm' : ''}`}
                        onClick={handleDelete}
                    >
                        {showDeleteConfirm ? '本当に削除？' : '🗑️ 削除'}
                    </button>
                    <div className="action-right">
                        <button className="btn btn-secondary" onClick={onClose}>
                            キャンセル
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={isSubmitting || !activityName.trim()}
                        >
                            {isSubmitting ? <span className="spinner"></span> : '💾 保存'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
