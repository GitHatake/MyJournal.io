// Journal Generation Component

import { FC, useState } from 'react';
import { JournalAnalysis, generateJournal, calculateTagSummary } from '../services/gemini';
import { Task, JournalEvent, MOOD_EMOJIS, formatDuration } from '../types/event';
import './JournalGenerator.css';

interface JournalGeneratorProps {
    tasks: Task[];
    events: JournalEvent[];
    date: string;
}

export const JournalGenerator: FC<JournalGeneratorProps> = ({ tasks, events, date }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [analysis, setAnalysis] = useState<JournalAnalysis | null>(null);
    const [error, setError] = useState<string | null>(null);

    const completedTasks = tasks.filter(t => !t.isActive);
    const tagSummary = calculateTagSummary(tasks);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);

        try {
            const result = await generateJournal(tasks, events, date);
            setAnalysis(result);
        } catch (err) {
            setError('ジャーナルの生成に失敗しました');
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    if (completedTasks.length === 0) {
        return null;
    }

    return (
        <div className="journal-generator">
            <div className="journal-header">
                <h2 className="section-title">🤖 AI振り返り</h2>
                <button
                    className="btn btn-primary generate-btn"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                >
                    {isGenerating ? (
                        <>
                            <span className="spinner"></span>
                            生成中...
                        </>
                    ) : (
                        <>✨ 振り返りを生成</>
                    )}
                </button>
            </div>

            {/* Tag Summary */}
            {tagSummary.length > 0 && (
                <div className="tag-summary card">
                    <h3>📊 今日の時間配分</h3>
                    <div className="tag-bars">
                        {tagSummary.map(({ tag, totalMinutes, percentage }) => (
                            <div key={tag} className="tag-bar-item">
                                <div className="tag-bar-label">
                                    <span className="tag-name">{tag}</span>
                                    <span className="tag-time">{formatDuration(totalMinutes)}</span>
                                </div>
                                <div className="tag-bar">
                                    <div
                                        className="tag-bar-fill"
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                                <span className="tag-percentage">{percentage}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {error && (
                <div className="journal-error card">
                    <p>{error}</p>
                </div>
            )}

            {analysis && (
                <div className="journal-analysis animate-slideUp">
                    {/* Overall Mood */}
                    <div className="mood-summary card">
                        <span className="mood-icon">{MOOD_EMOJIS[analysis.overallMood]}</span>
                        <span className="mood-label">今日の気分</span>
                    </div>

                    {/* Productivity */}
                    <div className="analysis-card card">
                        <div className="analysis-header">
                            <span className="analysis-icon">📈</span>
                            <h3>生産性評価</h3>
                        </div>
                        <p className="analysis-content">{analysis.productivity}</p>
                    </div>

                    {/* Mental Health */}
                    <div className="analysis-card card">
                        <div className="analysis-header">
                            <span className="analysis-icon">💭</span>
                            <h3>メンタルヘルス</h3>
                        </div>
                        <p className="analysis-content">{analysis.mentalHealth}</p>
                    </div>

                    {/* Lifelog */}
                    <div className="analysis-card card lifelog-card">
                        <div className="analysis-header">
                            <span className="analysis-icon">📔</span>
                            <h3>今日の振り返り</h3>
                        </div>
                        <p className="analysis-content">{analysis.lifelog}</p>
                    </div>
                </div>
            )}
        </div>
    );
};
