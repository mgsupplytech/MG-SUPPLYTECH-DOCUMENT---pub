import { AuthCredentials, AuthSession, AuthUser } from '../types';

const CREDENTIALS_KEY = 'mg_auth_credentials_v1';
const SESSION_KEY = 'mg_auth_session_v1';

// Default Master Administrator Credentials
export const DEFAULT_AUTH_CONFIG = {
  defaultLoginId: 'info@mgsupplytech.com',
  defaultAlias: 'admin',
  defaultPassword: 'MGSupply@2026',
  defaultDisplayName: 'Commercial Desk (MG Supplytech)',
  defaultRole: 'Administrator' as const
};

// SHA-256 password hashing via Web Crypto API with fallback
export const hashPassword = async (password: string, salt: string = 'mg_salt_2026'): Promise<string> => {
  const text = `${salt}:${password}`;
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(text);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback
    }
  }
  // Simple deterministic fallback hash
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `hash_${Math.abs(hash).toString(16)}`;
};

export class AuthService {
  private static instance: AuthService;

  private constructor() {
    this.ensureInitialized();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Ensure default credentials exist in storage
  private async ensureInitialized(): Promise<void> {
    try {
      const stored = localStorage.getItem(CREDENTIALS_KEY);
      if (!stored) {
        const defaultHash = await hashPassword(DEFAULT_AUTH_CONFIG.defaultPassword);
        const initialCreds: AuthCredentials = {
          loginId: DEFAULT_AUTH_CONFIG.defaultLoginId,
          passwordHash: defaultHash,
          salt: 'mg_salt_2026',
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(initialCreds));
      }
    } catch (e) {
      console.warn('Auth initialization storage warning:', e);
    }
  }

  // Authenticate user with Login ID and Password
  public async login(
    loginIdInput: string,
    passwordInput: string,
    rememberMe: boolean = true
  ): Promise<{ success: boolean; message: string; user?: AuthUser }> {
    const cleanId = loginIdInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    if (!cleanId) {
      return { success: false, message: 'Please enter your Login ID or registered Email.' };
    }
    if (!cleanPassword) {
      return { success: false, message: 'Please enter your Password.' };
    }

    try {
      let storedCreds: AuthCredentials | null = null;
      const rawCreds = localStorage.getItem(CREDENTIALS_KEY);
      if (rawCreds) {
        storedCreds = JSON.parse(rawCreds);
      }

      // Check if matches stored credentials OR default fallback
      const targetHash = await hashPassword(cleanPassword, storedCreds?.salt || 'mg_salt_2026');
      const defaultHash = await hashPassword(cleanPassword);

      const isStoredMatch =
        storedCreds &&
        (cleanId === storedCreds.loginId.toLowerCase() || (cleanId === 'admin' && storedCreds.loginId.includes('mgsupplytech'))) &&
        targetHash === storedCreds.passwordHash;

      const isDefaultMatch =
        (cleanId === DEFAULT_AUTH_CONFIG.defaultLoginId.toLowerCase() || cleanId === DEFAULT_AUTH_CONFIG.defaultAlias) &&
        (cleanPassword === DEFAULT_AUTH_CONFIG.defaultPassword || targetHash === defaultHash);

      if (isStoredMatch || isDefaultMatch) {
        const user: AuthUser = {
          id: 'user-mg-admin',
          loginId: storedCreds?.loginId || DEFAULT_AUTH_CONFIG.defaultLoginId,
          displayName: DEFAULT_AUTH_CONFIG.defaultDisplayName,
          role: DEFAULT_AUTH_CONFIG.defaultRole,
          email: DEFAULT_AUTH_CONFIG.defaultLoginId,
          lastLogin: new Date().toISOString()
        };

        const session: AuthSession = {
          token: `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          user,
          expiresAt: Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000), // 30 days or 8 hours
          rememberMe
        };

        // Save session
        const sessionStr = JSON.stringify(session);
        if (rememberMe) {
          localStorage.setItem(SESSION_KEY, sessionStr);
        } else {
          sessionStorage.setItem(SESSION_KEY, sessionStr);
          localStorage.removeItem(SESSION_KEY);
        }

        return { success: true, message: 'Login successful. Welcome back!', user };
      } else {
        return { success: false, message: 'Invalid Login ID or Password. Please try again.' };
      }
    } catch (err: any) {
      return { success: false, message: `Authentication error: ${err.message || 'Unknown error'}` };
    }
  }

  // Get active session if valid
  public getCurrentSession(): AuthSession | null {
    try {
      let rawSession = localStorage.getItem(SESSION_KEY);
      if (!rawSession) {
        rawSession = sessionStorage.getItem(SESSION_KEY);
      }
      if (!rawSession) return null;

      const session: AuthSession = JSON.parse(rawSession);
      if (Date.now() > session.expiresAt) {
        this.logout();
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  // Check if authenticated
  public isAuthenticated(): boolean {
    return this.getCurrentSession() !== null;
  }

  // End session
  public logout(): void {
    try {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
    } catch (e) {
      console.warn('Error during logout:', e);
    }
  }

  // Update password and/or Login ID
  public async updateCredentials(
    currentPasswordInput: string,
    newLoginIdInput: string,
    newPasswordInput?: string
  ): Promise<{ success: boolean; message: string }> {
    const rawCreds = localStorage.getItem(CREDENTIALS_KEY);
    let storedCreds: AuthCredentials;

    if (rawCreds) {
      storedCreds = JSON.parse(rawCreds);
    } else {
      const defaultHash = await hashPassword(DEFAULT_AUTH_CONFIG.defaultPassword);
      storedCreds = {
        loginId: DEFAULT_AUTH_CONFIG.defaultLoginId,
        passwordHash: defaultHash,
        salt: 'mg_salt_2026',
        updatedAt: new Date().toISOString()
      };
    }

    // Verify current password
    const checkHash = await hashPassword(currentPasswordInput.trim(), storedCreds.salt || 'mg_salt_2026');
    const isCurrentValid =
      checkHash === storedCreds.passwordHash || currentPasswordInput.trim() === DEFAULT_AUTH_CONFIG.defaultPassword;

    if (!isCurrentValid) {
      return { success: false, message: 'Current password verification failed. Please enter the correct current password.' };
    }

    const cleanNewLoginId = newLoginIdInput.trim();
    if (!cleanNewLoginId) {
      return { success: false, message: 'Login ID cannot be empty.' };
    }

    let updatedHash = storedCreds.passwordHash;
    if (newPasswordInput && newPasswordInput.trim().length > 0) {
      if (newPasswordInput.trim().length < 6) {
        return { success: false, message: 'New password must be at least 6 characters long.' };
      }
      updatedHash = await hashPassword(newPasswordInput.trim(), storedCreds.salt || 'mg_salt_2026');
    }

    const updatedCreds: AuthCredentials = {
      loginId: cleanNewLoginId,
      passwordHash: updatedHash,
      salt: storedCreds.salt || 'mg_salt_2026',
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(updatedCreds));

    // Update active session user if logged in
    const session = this.getCurrentSession();
    if (session) {
      session.user.loginId = cleanNewLoginId;
      session.user.email = cleanNewLoginId.includes('@') ? cleanNewLoginId : session.user.email;
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }

    return { success: true, message: 'Login credentials successfully updated!' };
  }

  // Get current stored login ID
  public getStoredLoginId(): string {
    try {
      const raw = localStorage.getItem(CREDENTIALS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.loginId || DEFAULT_AUTH_CONFIG.defaultLoginId;
      }
    } catch {}
    return DEFAULT_AUTH_CONFIG.defaultLoginId;
  }
}

export const authService = AuthService.getInstance();
