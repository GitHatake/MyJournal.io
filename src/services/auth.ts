// Google OAuth 2.0 Authentication Service

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

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
            accessToken = response.access_token;
            localStorage.setItem('gapi_access_token', accessToken);
            localStorage.setItem('gapi_token_expiry', String(Date.now() + response.expires_in * 1000));
        }
    });
};

// Request access token (triggers OAuth flow)
export const signIn = (): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!tokenClient) {
            reject(new Error('Token client not initialized'));
            return;
        }

        // Override callback for this request
        tokenClient.callback = (response: TokenResponse) => {
            if (response.error) {
                reject(new Error(response.error));
                return;
            }
            accessToken = response.access_token;
            localStorage.setItem('gapi_access_token', accessToken);
            localStorage.setItem('gapi_token_expiry', String(Date.now() + response.expires_in * 1000));
            resolve(accessToken);
        };

        // Check for stored token
        const storedToken = localStorage.getItem('gapi_access_token');
        const tokenExpiry = localStorage.getItem('gapi_token_expiry');

        if (storedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
            accessToken = storedToken;
            resolve(storedToken);
            return;
        }

        // Request new token
        tokenClient.requestAccessToken({ prompt: '' });
    });
};

// Sign out
export const signOut = (): void => {
    if (accessToken) {
        window.google.accounts.oauth2.revoke(accessToken, () => {
            console.log('Token revoked');
        });
    }
    accessToken = null;
    localStorage.removeItem('gapi_access_token');
    localStorage.removeItem('gapi_token_expiry');
    localStorage.removeItem('user_info');
};

// Get current access token
export const getAccessToken = (): string | null => {
    // Check if stored token is still valid
    const storedToken = localStorage.getItem('gapi_access_token');
    const tokenExpiry = localStorage.getItem('gapi_token_expiry');

    if (storedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
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

        localStorage.setItem('user_info', JSON.stringify(userInfo));
        return userInfo;
    } catch (error) {
        console.error('Error fetching user info:', error);
        return null;
    }
};

// Get cached user info
export const getCachedUserInfo = (): UserInfo | null => {
    const cached = localStorage.getItem('user_info');
    if (cached) {
        try {
            return JSON.parse(cached);
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
