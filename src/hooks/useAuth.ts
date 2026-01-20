// Authentication Hook
// Enhanced with silent re-authentication support

import { useState, useEffect, useCallback } from 'react';
import {
    initGoogleAuth,
    signIn as authSignIn,
    silentSignIn,
    signOut as authSignOut,
    isAuthenticated,
    fetchUserInfo,
    getCachedUserInfo,
    hasRecentLogin,
    UserInfo
} from '../services/auth';

interface UseAuthReturn {
    isLoading: boolean;
    isSignedIn: boolean;
    userInfo: UserInfo | null;
    signIn: () => Promise<void>;
    signOut: () => void;
    error: string | null;
}

export const useAuth = (): UseAuthReturn => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Initialize on mount
    useEffect(() => {
        const init = async () => {
            try {
                await initGoogleAuth();

                // Check for existing valid session
                if (isAuthenticated()) {
                    console.log('[useAuth] Found valid token, restoring session...');
                    setIsSignedIn(true);

                    // Use cached user info first for faster UI
                    const cached = getCachedUserInfo();
                    if (cached) {
                        setUserInfo(cached);
                    }

                    // Refresh user info in background
                    fetchUserInfo().then(info => {
                        if (info) setUserInfo(info);
                    }).catch(console.error);

                } else if (hasRecentLogin()) {
                    // User logged in recently, try silent re-authentication
                    console.log('[useAuth] Recent login found, attempting silent sign-in...');

                    // Show cached user info while authenticating
                    const cached = getCachedUserInfo();
                    if (cached) {
                        setUserInfo(cached);
                    }

                    try {
                        await silentSignIn();
                        console.log('[useAuth] Silent sign-in successful');
                        setIsSignedIn(true);

                        // Refresh user info
                        const info = await fetchUserInfo();
                        if (info) setUserInfo(info);
                    } catch (silentErr) {
                        console.log('[useAuth] Silent sign-in failed, user needs to log in manually');
                        // Don't show error, just let user log in manually
                    }
                } else {
                    console.log('[useAuth] No recent login, showing login screen');
                }
            } catch (err) {
                console.error('[useAuth] Init error:', err);
                setError('認証の初期化に失敗しました');
            } finally {
                setIsLoading(false);
            }
        };

        init();
    }, []);

    const signIn = useCallback(async () => {
        setError(null);
        setIsLoading(true);

        try {
            await authSignIn();
            setIsSignedIn(true);
            const info = await fetchUserInfo();
            setUserInfo(info);
        } catch (err) {
            console.error('[useAuth] Sign in error:', err);
            setError('ログインに失敗しました');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const signOut = useCallback(() => {
        authSignOut();
        setIsSignedIn(false);
        setUserInfo(null);
    }, []);

    return {
        isLoading,
        isSignedIn,
        userInfo,
        signIn,
        signOut,
        error
    };
};
