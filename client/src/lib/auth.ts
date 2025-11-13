// Simple JWT-based authentication client to replace Supabase

interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface Session {
  access_token: string;
  user: User;
}

interface AuthResponse {
  user: User;
  session: Session;
}

// Check if we're in development mode
const isDevelopment = import.meta.env.MODE === 'development' || import.meta.env.DEV;

// Default 'king' user for development
const DEV_USER: User = {
  id: 'king',
  email: 'king@dev.local',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const DEV_SESSION: Session = {
  access_token: 'dev-token-king',
  user: DEV_USER,
};

class AuthClient {
  private session: Session | null = null;
  private listeners: ((session: Session | null) => void)[] = [];

  constructor() {
    // In development mode, automatically set the 'king' user session
    if (isDevelopment) {
      this.session = DEV_SESSION;
      localStorage.setItem('session', JSON.stringify(DEV_SESSION));
    }
  }

  async signUp(email: string, password: string, metadata?: { fullName?: string }): Promise<AuthResponse> {
    const response = await fetch('http://localhost:3001/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        fullName: metadata?.fullName,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }

    const data: AuthResponse = await response.json();
    this.session = data.session;
    localStorage.setItem('session', JSON.stringify(data.session));
    this.notifyListeners();
    return data;
  }

  async signInWithPassword(credentials: { email: string; password: string }): Promise<AuthResponse> {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data: AuthResponse = await response.json();
    this.session = data.session;
    localStorage.setItem('session', JSON.stringify(data.session));
    this.notifyListeners();
    return data;
  }

  async signOut(): Promise<void> {
    this.session = null;
    localStorage.removeItem('session');
    this.notifyListeners();
  }

  async getSession(): Promise<{ data: { session: Session | null } }> {
    if (this.session) {
      return { data: { session: this.session } };
    }

    const stored = localStorage.getItem('session');
    if (stored) {
      try {
        this.session = JSON.parse(stored);
        return { data: { session: this.session } };
      } catch {
        localStorage.removeItem('session');
      }
    }

    return { data: { session: null } };
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void): { data: { subscription: { unsubscribe: () => void } } } {
    const listener = (session: Session | null) => {
      callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
    };

    this.listeners.push(listener);

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
              this.listeners.splice(index, 1);
            }
          },
        },
      },
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.session));
  }
}

export const auth = new AuthClient();
