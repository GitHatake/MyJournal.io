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
import { TaskEditModal } from './components/TaskEditModal';
import { Task, getTodayDateString } from './types/event';
import './styles/App.css';

function App() {
    const todayDateString = getTodayDateString();
    const [selectedDate, setSelectedDate] = useState(todayDateString);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isEditSubmitting, setIsEditSubmitting] = useState(false);

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
        loadDate,
        updateTask,
        deleteTask,
        addManualTask
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

    // Handle task edit
    const handleEditTask = (task: Task) => {
        setEditingTask(task);
    };

    // Handle save task edits
    const handleSaveTask = async (updates: Parameters<typeof updateTask>[1]) => {
        if (!editingTask) return;

        setIsEditSubmitting(true);
        try {
            await updateTask(editingTask.eventId, updates, selectedDate);
            setEditingTask(null);
        } finally {
            setIsEditSubmitting(false);
        }
    };

    // Handle delete task
    const handleDeleteTask = async () => {
        if (!editingTask) return;

        setIsEditSubmitting(true);
        try {
            await deleteTask(editingTask.eventId, selectedDate);
            setEditingTask(null);
        } finally {
            setIsEditSubmitting(false);
        }
    };

    // Handle manual task addition
    const handleManualTask = async (
        name: string,
        tags: string[],
        startTime: Date,
        endTime: Date,
        description?: string,
        moodScore?: number,
        progress?: number
    ) => {
        await addManualTask(name, tags, startTime, endTime, description, moodScore, progress, selectedDate);
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
                            onManualTask={handleManualTask}
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
                        <span className="past-notice-text">過去の日付を閲覧中（タップで編集可能）</span>
                    </div>
                )}

                <Timeline
                    tasks={tasks}
                    onEditTask={handleEditTask}
                />

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

            {/* Task Edit Modal */}
            {editingTask && (
                <TaskEditModal
                    task={editingTask}
                    onClose={() => setEditingTask(null)}
                    onSave={handleSaveTask}
                    onDelete={handleDeleteTask}
                    isSubmitting={isEditSubmitting}
                    suggestedTags={availableTags}
                />
            )}
        </div>
    );
}

export default App;
