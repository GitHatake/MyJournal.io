// Header Component

import { FC } from 'react';
import { UserInfo } from '../services/auth';
import './Header.css';

interface HeaderProps {
    userInfo: UserInfo | null;
    onSignOut: () => void;
    isLoading: boolean;
    onRefresh: () => void;
}

export const Header: FC<HeaderProps> = ({ userInfo, onSignOut, isLoading, onRefresh }) => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
    });

    return (
        <header className="app-header safe-area-top">
            <div className="header-content">
                <div className="header-left">
                    <h1 className="header-logo">📔</h1>
                    <div className="header-info">
                        <span className="header-date">{dateStr}</span>
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
