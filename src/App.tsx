// Main App Component

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
        refresh
    } = useJournal(isSignedIn);

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
                onRefresh={refresh}
            />

            <main className="app-main container safe-area-bottom">
                <TaskInput
                    onStartTask={startTask}
                    onAddMemo={addMemo}
                    suggestedTags={availableTags}
                />

                <ActiveTasks
                    tasks={activeTasks}
                    onEndTask={endTask}
                />

                <Timeline tasks={tasks} />

                <VerticalTimeline
                    tasks={tasks}
                    title="📅 タイムライン"
                />

                <JournalGenerator
                    tasks={tasks}
                    events={journal?.events || []}
                    date={getTodayDateString()}
                />
            </main>
        </div>
    );
}

export default App;
