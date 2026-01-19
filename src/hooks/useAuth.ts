// Authentication Hook

import { useState, useEffect, useCallback } from 'react';
import {
    initGoogleAuth,
    signIn as authSignIn,
    signOut as authSignOut,
    isAuthenticated,
    fetchUserInfo,
    getCachedUserInfo,
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

                // Check for existing session
                if (isAuthenticated()) {
                    setIsSignedIn(true);
                    const cached = getCachedUserInfo();
                    if (cached) {
                        setUserInfo(cached);
                    } else {
                        const info = await fetchUserInfo();
                        setUserInfo(info);
                    }
                }
            } catch (err) {
                console.error('Auth init error:', err);
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
            console.error('Sign in error:', err);
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
