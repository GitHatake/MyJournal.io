// Gemini AI Service

import { Task, JournalEvent, MOOD_EMOJIS, formatDuration } from '../types/event';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

export interface JournalAnalysis {
    productivity: string;
    mentalHealth: string;
    lifelog: string;
    tagSummary: TagTimeSummary[];
    overallMood: number;
}

export interface TagTimeSummary {
    tag: string;
    totalMinutes: number;
    percentage: number;
}

// Convert tasks to analysis-ready format
const prepareTasksForAnalysis = (tasks: Task[]): string => {
    const completedTasks = tasks.filter(t => !t.isActive && t.duration);

    if (completedTasks.length === 0) {
        return '今日はまだ完了したタスクがありません。';
    }

    const lines = completedTasks.map(task => {
        const mood = task.moodScore ? MOOD_EMOJIS[task.moodScore] : '';
        const tags = task.tags.length > 0 ? `[${task.tags.join(', ')}]` : '';
        const duration = task.duration ? formatDuration(task.duration) : '';
        const desc = task.description ? ` - ${task.description}` : '';

        return `- ${task.activityName} ${tags} (${duration}) ${mood}${desc}`;
    });

    return lines.join('\n');
};

// Calculate tag time summary
export const calculateTagSummary = (tasks: Task[]): TagTimeSummary[] => {
    const completedTasks = tasks.filter(t => !t.isActive && t.duration);
    const tagMinutes = new Map<string, number>();
    let totalMinutes = 0;

    for (const task of completedTasks) {
        const duration = task.duration || 0;
        totalMinutes += duration;

        if (task.tags.length === 0) {
            tagMinutes.set('その他', (tagMinutes.get('その他') || 0) + duration);
        } else {
            for (const tag of task.tags) {
                tagMinutes.set(tag, (tagMinutes.get(tag) || 0) + duration);
            }
        }
    }

    const summary: TagTimeSummary[] = [];
    for (const [tag, minutes] of tagMinutes) {
        summary.push({
            tag,
            totalMinutes: minutes,
            percentage: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0
        });
    }

    return summary.sort((a, b) => b.totalMinutes - a.totalMinutes);
};

// Generate journal using Gemini API
export const generateJournal = async (
    tasks: Task[],
    events: JournalEvent[],
    date: string
): Promise<JournalAnalysis> => {
    const taskSummary = prepareTasksForAnalysis(tasks);
    const tagSummary = calculateTagSummary(tasks);

    // Calculate average mood
    const completedTasks = tasks.filter(t => !t.isActive && t.moodScore);
    const avgMood = completedTasks.length > 0
        ? Math.round(completedTasks.reduce((sum, t) => sum + (t.moodScore || 3), 0) / completedTasks.length)
        : 3;

    // Get memos
    const memos = events
        .filter((e): e is Extract<JournalEvent, { type: 'MEMO' }> => e.type === 'MEMO')
        .map(m => m.content);

    const prompt = `
あなたは個人のライフログを分析するAIアシスタントです。
以下は${date}の活動記録です。この記録を分析し、ユーザーにとって有益なフィードバックを日本語で提供してください。

## 今日の活動記録
${taskSummary}

${memos.length > 0 ? `## メモ\n${memos.join('\n')}` : ''}

## タグ別時間
${tagSummary.map(t => `- ${t.tag}: ${formatDuration(t.totalMinutes)} (${t.percentage}%)`).join('\n')}

以下の3つの観点で分析し、それぞれ2-3文で簡潔にまとめてください：

1. **生産性評価**: 時間の使い方、集中できた時間帯、改善点
2. **メンタルヘルス**: 気分の傾向、何をしている時が楽しそうか、ストレス要因
3. **今日の振り返り**: 1日のハイライトを日記形式で

回答は以下のJSON形式で返してください（説明文のみ、コードブロックなし）：
{"productivity": "...", "mentalHealth": "...", "lifelog": "..."}
`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024
                }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Gemini API error');
        }

        const data = await response.json();
        console.log('Gemini API response:', data);

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('Gemini text response:', text);

        if (!text) {
            throw new Error('Empty response from Gemini');
        }

        // Remove markdown code blocks if present (```json ... ```)
        let cleanedText = text;
        const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
            cleanedText = codeBlockMatch[1].trim();
        }

        // Parse JSON from response
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('Failed to find JSON in response:', cleanedText);
            throw new Error('Failed to parse Gemini response - no JSON found');
        }

        const analysis = JSON.parse(jsonMatch[0]);

        return {
            productivity: analysis.productivity || '分析データが不十分です。',
            mentalHealth: analysis.mentalHealth || '分析データが不十分です。',
            lifelog: analysis.lifelog || '今日の活動記録がありません。',
            tagSummary,
            overallMood: avgMood
        };
    } catch (error) {
        console.error('Gemini API error:', error);

        // Return fallback analysis
        return {
            productivity: 'AI分析を実行できませんでした。後でもう一度お試しください。',
            mentalHealth: 'AI分析を実行できませんでした。',
            lifelog: taskSummary || '今日の活動記録がありません。',
            tagSummary,
            overallMood: avgMood
        };
    }
};
