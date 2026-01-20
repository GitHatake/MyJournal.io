// Google OAuth 2.0 Authentication Service
// Enhanced with better token persistence and silent re-authentication

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

// Storage keys
const STORAGE_KEYS = {
    ACCESS_TOKEN: 'myjournal_access_token',
    TOKEN_EXPIRY: 'myjournal_token_expiry',
    USER_INFO: 'myjournal_user_info',
    LAST_LOGIN: 'myjournal_last_login'
};

// Types for Google Identity Services
interface TokenResponse {
    access_token: string;
    expires_in: number;
    error?: string;
}

interface TokenClient {
    callback: (response: TokenResponse) => void;
    requestAccessToken: (options: { prompt: string }) => void;
}

interface GoogleAccounts {
    oauth2: {
        initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: TokenResponse) => void;
        }) => TokenClient;
        revoke: (token: string, callback: () => void) => void;
    };
}

interface GoogleAPI {
    accounts: GoogleAccounts;
}

declare global {
    interface Window {
        google: GoogleAPI;
    }
}

let tokenClient: TokenClient | null = null;
let accessToken: string | null = null;
let tokenRefreshTimer: number | null = null;

export interface AuthState {
    isAuthenticated: boolean;
    accessToken: string | null;
    userInfo: UserInfo | null;
}

export interface UserInfo {
    email: string;
    name: string;
    picture: string;
}

// Initialize Google Identity Services
export const initGoogleAuth = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (window.google?.accounts?.oauth2) {
            initTokenClient();
            resolve();
            return;
        }

        // Load GSI script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            initTokenClient();
            resolve();
        };
        script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
        document.head.appendChild(script);
    });
};

const initTokenClient = () => {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response: TokenResponse) => {
            if (response.error) {
                console.error('Token error:', response.error);
                return;
            }
            saveToken(response.access_token, response.expires_in);
        }
    });
};

// Save token with expiry
const saveToken = (token: string, expiresIn: number) => {
    accessToken = token;
    const expiryTime = Date.now() + expiresIn * 1000;

    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, String(expiryTime));
    localStorage.setItem(STORAGE_KEYS.LAST_LOGIN, String(Date.now()));

    // Also save to sessionStorage for faster access
    sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    sessionStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, String(expiryTime));

    // Schedule token refresh (5 minutes before expiry)
    scheduleTokenRefresh(expiresIn - 300);

    console.log('[Auth] Token saved, expires in', expiresIn, 'seconds');
};

// Schedule automatic token refresh
const scheduleTokenRefresh = (delaySeconds: number) => {
    if (tokenRefreshTimer) {
        clearTimeout(tokenRefreshTimer);
    }

    if (delaySeconds > 0) {
        tokenRefreshTimer = window.setTimeout(() => {
            console.log('[Auth] Auto-refreshing token...');
            silentSignIn().catch(err => {
                console.warn('[Auth] Silent refresh failed:', err);
            });
        }, delaySeconds * 1000);
    }
};

// Silent sign-in (no prompt)
export const silentSignIn = (): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!tokenClient) {
            reject(new Error('Token client not initialized'));
            return;
        }

        tokenClient.callback = (response: TokenResponse) => {
            if (response.error) {
                reject(new Error(response.error));
                return;
            }
            saveToken(response.access_token, response.expires_in);
            resolve(response.access_token);
        };

        // Request token without prompt (will fail if user hasn't granted access before)
        tokenClient.requestAccessToken({ prompt: '' });
    });
};

// Request access token (triggers OAuth flow)
export const signIn = (): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!tokenClient) {
            reject(new Error('Token client not initialized'));
            return;
        }

        // Check for stored valid token first
        const storedToken = getStoredToken();
        if (storedToken) {
            accessToken = storedToken;
            resolve(storedToken);
            return;
        }

        // Override callback for this request
        tokenClient.callback = (response: TokenResponse) => {
            if (response.error) {
                reject(new Error(response.error));
                return;
            }
            saveToken(response.access_token, response.expires_in);
            resolve(response.access_token);
        };

        // Try silent sign-in first, fall back to prompt
        tokenClient.requestAccessToken({ prompt: '' });
    });
};

// Get stored token if still valid
const getStoredToken = (): string | null => {
    // Check sessionStorage first (faster)
    let token = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    let expiry = sessionStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);

    // Fall back to localStorage
    if (!token) {
        token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    }

    if (token && expiry) {
        const expiryTime = parseInt(expiry);
        // Add 60 second buffer to avoid edge cases
        if (Date.now() < expiryTime - 60000) {
            // Restore to sessionStorage if from localStorage
            sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
            sessionStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiry);
            return token;
        }
    }

    return null;
};

// Sign out
export const signOut = (): void => {
    if (accessToken) {
        window.google.accounts.oauth2.revoke(accessToken, () => {
            console.log('[Auth] Token revoked');
        });
    }

    // Clear token refresh timer
    if (tokenRefreshTimer) {
        clearTimeout(tokenRefreshTimer);
        tokenRefreshTimer = null;
    }

    accessToken = null;

    // Clear all storage
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
};

// Get current access token
export const getAccessToken = (): string | null => {
    // Check memory first
    if (accessToken) {
        const expiry = sessionStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
        if (expiry && Date.now() < parseInt(expiry) - 60000) {
            return accessToken;
        }
    }

    // Check storage
    const storedToken = getStoredToken();
    if (storedToken) {
        accessToken = storedToken;
        return storedToken;
    }

    return null;
};

// Fetch user info from Google
export const fetchUserInfo = async (): Promise<UserInfo | null> => {
    const token = getAccessToken();
    if (!token) return null;

    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user info');
        }

        const data = await response.json();
        const userInfo: UserInfo = {
            email: data.email,
            name: data.name,
            picture: data.picture
        };

        // Save to both storages
        const userInfoStr = JSON.stringify(userInfo);
        localStorage.setItem(STORAGE_KEYS.USER_INFO, userInfoStr);
        sessionStorage.setItem(STORAGE_KEYS.USER_INFO, userInfoStr);

        return userInfo;
    } catch (error) {
        console.error('[Auth] Error fetching user info:', error);
        return null;
    }
};

// Get cached user info
export const getCachedUserInfo = (): UserInfo | null => {
    // Check sessionStorage first
    let cached = sessionStorage.getItem(STORAGE_KEYS.USER_INFO);
    if (!cached) {
        cached = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    }

    if (cached) {
        try {
            const userInfo = JSON.parse(cached);
            // Restore to sessionStorage
            sessionStorage.setItem(STORAGE_KEYS.USER_INFO, cached);
            return userInfo;
        } catch {
            return null;
        }
    }
    return null;
};

// Check if authenticated
export const isAuthenticated = (): boolean => {
    return getAccessToken() !== null;
};

// Check if user has logged in recently (within 7 days)
export const hasRecentLogin = (): boolean => {
    const lastLogin = localStorage.getItem(STORAGE_KEYS.LAST_LOGIN);
    if (lastLogin) {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        return parseInt(lastLogin) > sevenDaysAgo;
    }
    return false;
};
