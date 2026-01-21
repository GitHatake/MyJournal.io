// Journal Generation Component

import { FC, useState, useEffect } from 'react';
import { JournalAnalysis, generateJournal, calculateTagSummary } from '../services/gemini';
import { saveAnalysis, loadAnalysis } from '../services/drive';
import { Task, JournalEvent, MOOD_EMOJIS } from '../types/event';
import { PieChart } from './PieChart';
import './JournalGenerator.css';

interface JournalGeneratorProps {
    tasks: Task[];
    events: JournalEvent[];
    date: string;
}

export const JournalGenerator: FC<JournalGeneratorProps> = ({ tasks, events, date }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoadingCached, setIsLoadingCached] = useState(false);
    const [analysis, setAnalysis] = useState<JournalAnalysis | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isCached, setIsCached] = useState(false);

    const completedTasks = tasks.filter(t => !t.isActive);
    const tagSummary = calculateTagSummary(tasks);

    // Calculate actual total work time (sum of all task durations)
    const actualTotalMinutes = completedTasks.reduce((sum, t) => sum + (t.duration || 0), 0);

    // Load cached analysis on mount or date change
    useEffect(() => {
        const loadCachedAnalysis = async () => {
            setIsLoadingCached(true);
            setAnalysis(null);
            setIsCached(false);

            try {
                const cached = await loadAnalysis(date);
                if (cached) {
                    setAnalysis(cached as JournalAnalysis);
                    setIsCached(true);
                }
            } catch (err) {
                console.error('Failed to load cached analysis:', err);
            } finally {
                setIsLoadingCached(false);
            }
        };

        loadCachedAnalysis();
    }, [date]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);

        try {
            const result = await generateJournal(tasks, events, date);
            setAnalysis(result);
            setIsCached(false);

            // Save to Drive
            await saveAnalysis(date, result);
            setIsCached(true);
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
                <div className="journal-actions">
                    {isCached && (
                        <span className="cached-indicator">💾 保存済み</span>
                    )}
                    <button
                        className="btn btn-primary generate-btn"
                        onClick={handleGenerate}
                        disabled={isGenerating || isLoadingCached}
                    >
                        {isGenerating ? (
                            <>
                                <span className="spinner"></span>
                                生成中...
                            </>
                        ) : isLoadingCached ? (
                            <>
                                <span className="spinner"></span>
                                読込中...
                            </>
                        ) : analysis ? (
                            <>🔄 再生成</>
                        ) : (
                            <>✨ 振り返りを生成</>
                        )}
                    </button>
                </div>
            </div>

            {/* Pie Chart for Tag Time Distribution */}
            {tagSummary.length > 0 && (
                <PieChart
                    data={tagSummary}
                    title="📊 今日の時間配分"
                    actualTotalMinutes={actualTotalMinutes}
                />
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
