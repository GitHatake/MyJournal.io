// Task Input Component

import { FC, useState, useRef, useEffect } from 'react';
import './TaskInput.css';

interface TaskInputProps {
    onStartTask: (name: string, tags: string[]) => Promise<string>;
    onAddMemo: (content: string) => Promise<void>;
    suggestedTags?: string[];
}

type InputMode = 'task' | 'memo';

export const TaskInput: FC<TaskInputProps> = ({ onStartTask, onAddMemo, suggestedTags = [] }) => {
    const [mode, setMode] = useState<InputMode>('task');
    const [taskName, setTaskName] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [memoContent, setMemoContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showTagSuggestions, setShowTagSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

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
        if (mode === 'task') {
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
