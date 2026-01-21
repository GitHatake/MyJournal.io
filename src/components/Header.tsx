// Header Component with Date Picker

import { FC, useRef } from 'react';
import { UserInfo } from '../services/auth';
import './Header.css';

interface HeaderProps {
    userInfo: UserInfo | null;
    onSignOut: () => void;
    isLoading: boolean;
    onRefresh: () => void;
    selectedDate: string;
    onDateChange: (date: string) => void;
    todayDateString: string;
}

export const Header: FC<HeaderProps> = ({
    userInfo,
    onSignOut,
    isLoading,
    onRefresh,
    selectedDate,
    onDateChange,
    todayDateString
}) => {
    const dateInputRef = useRef<HTMLInputElement>(null);

    const isViewingPast = selectedDate !== todayDateString;

    // Format selected date for display
    const displayDate = new Date(selectedDate + 'T00:00:00');
    const dateStr = displayDate.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
    });

    const handleDateClick = () => {
        // Trigger the hidden date input
        if (dateInputRef.current) {
            dateInputRef.current.showPicker();
        }
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        if (newDate) {
            onDateChange(newDate);
        }
    };

    const handleGoToToday = () => {
        onDateChange(todayDateString);
    };

    return (
        <header className="app-header safe-area-top">
            <div className="header-content">
                <div className="header-left">
                    <h1 className="header-logo">📔</h1>
                    <div className="header-info">
                        <button
                            className="date-picker-btn"
                            onClick={handleDateClick}
                            title="日付を選択"
                        >
                            <span className="header-date">
                                {isViewingPast && <span className="past-indicator">📆 </span>}
                                {dateStr}
                            </span>
                            <span className="date-picker-icon">▼</span>
                        </button>
                        <input
                            type="date"
                            ref={dateInputRef}
                            className="hidden-date-input"
                            value={selectedDate}
                            max={todayDateString}
                            onChange={handleDateChange}
                        />
                        {isViewingPast && (
                            <button
                                className="btn btn-secondary btn-sm today-btn"
                                onClick={handleGoToToday}
                            >
                                今日に戻る
                            </button>
                        )}
                    </div>
                </div>

                <div className="header-right">
                    <button
                        className="btn btn-icon btn-secondary refresh-btn"
                        onClick={onRefresh}
                        disabled={isLoading}
                    >
                        {isLoading ? <span className="spinner"></span> : '🔄'}
                    </button>

                    {userInfo && (
                        <div className="user-menu">
                            <button className="user-avatar-btn" onClick={onSignOut}>
                                {userInfo.picture ? (
                                    <img
                                        src={userInfo.picture}
                                        alt={userInfo.name}
                                        className="user-avatar"
                                    />
                                ) : (
                                    <div className="user-avatar-placeholder">
                                        {userInfo.name.charAt(0)}
                                    </div>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
