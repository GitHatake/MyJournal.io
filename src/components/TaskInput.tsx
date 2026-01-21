// Task Input Component

import { FC, useState, useRef, useEffect } from 'react';
import { MOOD_EMOJIS } from '../types/event';
import './TaskInput.css';

interface TaskInputProps {
    onStartTask: (name: string, tags: string[]) => Promise<string>;
    onAddMemo: (content: string) => Promise<void>;
    suggestedTags?: string[];
    onManualTask?: (
        name: string,
        tags: string[],
        startTime: Date,
        endTime: Date,
        description?: string,
        moodScore?: number,
        progress?: number
    ) => Promise<void>;
}

type InputMode = 'task' | 'manual' | 'memo';

// Get current time as HH:MM string
const getCurrentTimeStr = (): string => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

// Get time 1 hour ago as HH:MM string
const getOneHourAgoTimeStr = (): string => {
    const now = new Date();
    now.setHours(now.getHours() - 1);
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

// Parse HH:MM string to Date (today)
const parseTimeStr = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
};

export const TaskInput: FC<TaskInputProps> = ({ onStartTask, onAddMemo, suggestedTags = [], onManualTask }) => {
    const [mode, setMode] = useState<InputMode>('task');
    const [taskName, setTaskName] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [memoContent, setMemoContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showTagSuggestions, setShowTagSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Manual mode fields
    const [manualStartTime, setManualStartTime] = useState(getOneHourAgoTimeStr());
    const [manualEndTime, setManualEndTime] = useState(getCurrentTimeStr());
    const [manualDescription, setManualDescription] = useState('');
    const [manualMoodScore, setManualMoodScore] = useState(3);
    const [manualProgress, setManualProgress] = useState(100);

    const filteredSuggestions = suggestedTags.filter(
        tag => tag.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(tag)
    );

    const handleAddTag = (tag: string) => {
        const trimmedTag = tag.trim();
        if (trimmedTag && !tags.includes(trimmedTag)) {
            setTags([...tags, trimmedTag]);
        }
        setTagInput('');
        setShowTagSuggestions(false);
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            handleAddTag(tagInput);
        } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
            setTags(tags.slice(0, -1));
        }
    };

    const handleSubmitTask = async () => {
        if (!taskName.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onStartTask(taskName.trim(), tags);
            setTaskName('');
            setTags([]);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitManualTask = async () => {
        if (!taskName.trim() || isSubmitting || !onManualTask) return;

        const startTime = parseTimeStr(manualStartTime);
        const endTime = parseTimeStr(manualEndTime);

        // Validate times
        if (endTime <= startTime) {
            alert('終了時間は開始時間より後にしてください');
            return;
        }

        setIsSubmitting(true);
        try {
            await onManualTask(
                taskName.trim(),
                tags,
                startTime,
                endTime,
                manualDescription || undefined,
                manualMoodScore,
                manualProgress
            );
            // Reset form
            setTaskName('');
            setTags([]);
            setManualDescription('');
            setManualMoodScore(3);
            setManualProgress(100);
            setManualStartTime(getOneHourAgoTimeStr());
            setManualEndTime(getCurrentTimeStr());
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitMemo = async () => {
        if (!memoContent.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onAddMemo(memoContent.trim());
            setMemoContent('');
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (mode === 'task' || mode === 'manual') {
            inputRef.current?.focus();
        }
    }, [mode]);

    return (
        <div className="task-input card">
            <div className="input-mode-tabs">
                <button
                    className={`mode-tab ${mode === 'task' ? 'active' : ''}`}
                    onClick={() => setMode('task')}
                >
                    ⏱️ タスク開始
                </button>
                {onManualTask && (
                    <button
                        className={`mode-tab ${mode === 'manual' ? 'active' : ''}`}
                        onClick={() => setMode('manual')}
                    >
                        ✏️ 手動入力
                    </button>
                )}
                <button
                    className={`mode-tab ${mode === 'memo' ? 'active' : ''}`}
                    onClick={() => setMode('memo')}
                >
                    📝 メモ
                </button>
            </div>

            {mode === 'task' ? (
                <div className="task-form">
                    <input
                        ref={inputRef}
                        type="text"
                        className="input task-name-input"
                        placeholder="何を始めますか？"
                        value={taskName}
                        onChange={(e) => setTaskName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmitTask()}
                    />

                    <div className="tags-input-container">
                        <div className="tags-display">
                            {tags.map(tag => (
                                <span key={tag} className="tag">
                                    {tag}
                                    <button
                                        className="tag-remove"
                                        onClick={() => handleRemoveTag(tag)}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                            <input
                                type="text"
                                className="tag-input"
                                placeholder={tags.length === 0 ? "タグを追加..." : ""}
                                value={tagInput}
                                onChange={(e) => {
                                    setTagInput(e.target.value);
                                    setShowTagSuggestions(true);
                                }}
                                onKeyDown={handleTagKeyDown}
                                onFocus={() => setShowTagSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                            />
                        </div>

                        {showTagSuggestions && filteredSuggestions.length > 0 && (
                            <div className="tag-suggestions">
                                {filteredSuggestions.slice(0, 5).map(tag => (
                                    <button
                                        key={tag}
                                        className="tag-suggestion"
                                        onClick={() => handleAddTag(tag)}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        className="btn btn-primary submit-btn"
                        onClick={handleSubmitTask}
                        disabled={!taskName.trim() || isSubmitting}
                    >
                        {isSubmitting ? (
                            <span className="spinner"></span>
                        ) : (
                            <>▶️ 開始</>
                        )}
                    </button>
                </div>
            ) : mode === 'manual' ? (
                <div className="manual-form">
                    <input
                        ref={inputRef}
                        type="text"
                        className="input task-name-input"
                        placeholder="タスク名"
                        value={taskName}
                        onChange={(e) => setTaskName(e.target.value)}
                    />

                    <div className="tags-input-container">
                        <div className="tags-display">
                            {tags.map(tag => (
                                <span key={tag} className="tag">
                                    {tag}
                                    <button
                                        className="tag-remove"
                                        onClick={() => handleRemoveTag(tag)}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                            <input
                                type="text"
                                className="tag-input"
                                placeholder={tags.length === 0 ? "タグを追加..." : ""}
                                value={tagInput}
                                onChange={(e) => {
                                    setTagInput(e.target.value);
                                    setShowTagSuggestions(true);
                                }}
                                onKeyDown={handleTagKeyDown}
                                onFocus={() => setShowTagSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                            />
                        </div>

                        {showTagSuggestions && filteredSuggestions.length > 0 && (
                            <div className="tag-suggestions">
                                {filteredSuggestions.slice(0, 5).map(tag => (
                                    <button
                                        key={tag}
                                        className="tag-suggestion"
                                        onClick={() => handleAddTag(tag)}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="time-inputs">
                        <div className="time-input-group">
                            <label>開始</label>
                            <input
                                type="time"
                                className="input time-input"
                                value={manualStartTime}
                                onChange={(e) => setManualStartTime(e.target.value)}
                            />
                        </div>
                        <span className="time-separator">→</span>
                        <div className="time-input-group">
                            <label>終了</label>
                            <input
                                type="time"
                                className="input time-input"
                                value={manualEndTime}
                                onChange={(e) => setManualEndTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <textarea
                        className="input manual-description"
                        placeholder="メモ/振り返り（任意）"
                        value={manualDescription}
                        onChange={(e) => setManualDescription(e.target.value)}
                        rows={2}
                    />

                    <div className="manual-mood-row">
                        <label>気分:</label>
                        <div className="mood-selector-inline">
                            {[1, 2, 3, 4, 5].map((score) => (
                                <button
                                    key={score}
                                    className={`mood-btn-sm ${manualMoodScore === score ? 'active' : ''}`}
                                    onClick={() => setManualMoodScore(score)}
                                >
                                    {MOOD_EMOJIS[score]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        className="btn btn-primary submit-btn"
                        onClick={handleSubmitManualTask}
                        disabled={!taskName.trim() || isSubmitting}
                    >
                        {isSubmitting ? (
                            <span className="spinner"></span>
                        ) : (
                            <>💾 追加</>
                        )}
                    </button>
                </div>
            ) : (
                <div className="memo-form">
                    <textarea
                        className="input memo-textarea"
                        placeholder="メモを入力..."
                        value={memoContent}
                        onChange={(e) => setMemoContent(e.target.value)}
                        rows={3}
                    />
                    <button
                        className="btn btn-primary submit-btn"
                        onClick={handleSubmitMemo}
                        disabled={!memoContent.trim() || isSubmitting}
                    >
                        {isSubmitting ? (
                            <span className="spinner"></span>
                        ) : (
                            <>💾 保存</>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};
