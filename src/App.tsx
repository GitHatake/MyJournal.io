// Main App Component

import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useJournal } from './hooks/useJournal';
import { LoginScreen } from './components/LoginScreen';
import { Header } from './components/Header';
import { TaskInput } from './components/TaskInput';
import { ActiveTasks } from './components/ActiveTasks';
import { Timeline } from './components/Timeline';
import { VerticalTimeline } from './components/VerticalTimeline';
import { JournalGenerator } from './components/JournalGenerator';
import { getTodayDateString } from './types/event';
import './styles/App.css';

function App() {
    const todayDateString = getTodayDateString();
    const [selectedDate, setSelectedDate] = useState(todayDateString);

    const {
        isLoading: authLoading,
        isSignedIn,
        userInfo,
        signIn,
        signOut,
        error: authError
    } = useAuth();

    const {
        journal,
        tasks,
        activeTasks,
        availableTags,
        isLoading: journalLoading,
        startTask,
        endTask,
        addMemo,
        refresh,
        loadDate
    } = useJournal(isSignedIn);

    const isViewingPast = selectedDate !== todayDateString;

    // Handle date change
    const handleDateChange = async (date: string) => {
        setSelectedDate(date);
        if (date === todayDateString) {
            await refresh();
        } else {
            await loadDate(date);
        }
    };

    // Handle refresh (always reload selected date)
    const handleRefresh = async () => {
        if (selectedDate === todayDateString) {
            await refresh();
        } else {
            await loadDate(selectedDate);
        }
    };

    // Show login screen if not authenticated
    if (!isSignedIn) {
        return (
            <LoginScreen
                onLogin={signIn}
                isLoading={authLoading}
                error={authError}
            />
        );
    }

    return (
        <div className="app">
            <Header
                userInfo={userInfo}
                onSignOut={signOut}
                isLoading={journalLoading}
                onRefresh={handleRefresh}
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
                todayDateString={todayDateString}
            />

            <main className="app-main container safe-area-bottom">
                {/* Only show task input and active tasks for today */}
                {!isViewingPast && (
                    <>
                        <TaskInput
                            onStartTask={startTask}
                            onAddMemo={addMemo}
                            suggestedTags={availableTags}
                        />

                        <ActiveTasks
                            tasks={activeTasks}
                            onEndTask={endTask}
                        />
                    </>
                )}

                {/* Show read-only notice when viewing past */}
                {isViewingPast && (
                    <div className="past-notice card">
                        <span className="past-notice-icon">📅</span>
                        <span className="past-notice-text">過去の日付を閲覧中（編集不可）</span>
                    </div>
                )}

                <Timeline tasks={tasks} />

                <VerticalTimeline
                    tasks={tasks}
                    title="📅 タイムライン"
                />

                <JournalGenerator
                    tasks={tasks}
                    events={journal?.events || []}
                    date={selectedDate}
                />
            </main>
        </div>
    );
}

export default App;
