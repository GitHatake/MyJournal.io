// Pie Chart Component for Tag Time Distribution

import { FC } from 'react';
import { TagTimeSummary } from '../services/gemini';
import { formatDuration } from '../types/event';
import './PieChart.css';

interface PieChartProps {
    data: TagTimeSummary[];
    title?: string;
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

export const PieChart: FC<PieChartProps> = ({ data, title }) => {
    if (data.length === 0) {
        return null;
    }

    // Calculate total and create segments
    const total = data.reduce((sum, item) => sum + item.totalMinutes, 0);

    // Build conic gradient string
    let currentAngle = 0;
    const gradientParts: string[] = [];
    const segments: Array<{ tag: string; percentage: number; color: string; minutes: number }> = [];

    data.forEach((item, index) => {
        const color = CHART_COLORS[index % CHART_COLORS.length];
        const percentage = (item.totalMinutes / total) * 100;
        const startAngle = currentAngle;
        const endAngle = currentAngle + percentage;

        gradientParts.push(`${color} ${startAngle}% ${endAngle}%`);
        segments.push({
            tag: item.tag,
            percentage: item.percentage,
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
                            <span className="pie-chart-total">{formatDuration(total)}</span>
                            <span className="pie-chart-label">合計</span>
                        </div>
                    </div>
                </div>

                <div className="pie-chart-legend">
                    {segments.map(({ tag, percentage, color, minutes }) => (
                        <div key={tag} className="legend-item">
                            <span
                                className="legend-color"
                                style={{ backgroundColor: color }}
                            ></span>
                            <span className="legend-tag">{tag}</span>
                            <span className="legend-value">
                                {formatDuration(minutes)} ({percentage}%)
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
