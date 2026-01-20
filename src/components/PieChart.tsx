// Pie Chart Component for Tag Time Distribution
// Displays percentage of time spent on each tag relative to total work time
// When tasks have multiple tags, percentages can sum to > 100%

import { FC } from 'react';
import { TagTimeSummary } from '../services/gemini';
import { formatDuration } from '../types/event';
import './PieChart.css';

interface PieChartProps {
    data: TagTimeSummary[];
    title?: string;
    actualTotalMinutes: number; // Actual work time (sum of task durations)
}

// Color palette for chart segments
const CHART_COLORS = [
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

export const PieChart: FC<PieChartProps> = ({ data, title, actualTotalMinutes }) => {
    if (data.length === 0) {
        return null;
    }

    // Calculate sum of all tag minutes (for normalizing pie segments)
    const tagTotalMinutes = data.reduce((sum, item) => sum + item.totalMinutes, 0);

    // Build conic gradient string (normalized to 100%)
    let currentAngle = 0;
    const gradientParts: string[] = [];
    const segments: Array<{ tag: string; percentage: number; color: string; minutes: number }> = [];

    data.forEach((item, index) => {
        const color = CHART_COLORS[index % CHART_COLORS.length];
        // Normalize segment size to fit within 100% of the pie
        const normalizedPercentage = (item.totalMinutes / tagTotalMinutes) * 100;
        const startAngle = currentAngle;
        const endAngle = currentAngle + normalizedPercentage;

        gradientParts.push(`${color} ${startAngle}% ${endAngle}%`);
        segments.push({
            tag: item.tag,
            percentage: item.percentage, // Display percentage (relative to actual work time)
            color,
            minutes: item.totalMinutes
        });

        currentAngle = endAngle;
    });

    const conicGradient = `conic-gradient(${gradientParts.join(', ')})`;

    return (
        <div className="pie-chart-container card">
            {title && <h3 className="pie-chart-title">{title}</h3>}

            <div className="pie-chart-content">
                <div className="pie-chart-wrapper">
                    <div
                        className="pie-chart"
                        style={{ background: conicGradient }}
                    >
                        <div className="pie-chart-center">
                            <span className="pie-chart-total">{formatDuration(actualTotalMinutes)}</span>
                            <span className="pie-chart-label">合計</span>
                        </div>
                    </div>
                </div>

                <div className="pie-chart-legend-wrapper">
                    <div className="pie-chart-legend">
                        {segments.map(({ tag, percentage, color, minutes }) => (
                            <div key={tag} className="legend-item">
                                <span
                                    className="legend-color"
                                    style={{ backgroundColor: color }}
                                ></span>
                                <span className="legend-tag">{tag}</span>
                                <span className="legend-value">
                                    {percentage}% ({formatDuration(minutes)})
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
