import React, { createContext, useCallback, useEffect, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types'; // Ensure this imports from your updated types file
import apiService from '../services/api';

type AuthState = {
  isLoading: boolean;
  isSignout: boolean;
  user: User | null;
};

type AuthAction =
  | { type: 'RESTORE_TOKEN'; payload: User | null }
  | { type: 'SIGN_IN'; payload: User }
  | { type: 'SIGN_OUT' }
  | { type: 'SIGN_UP'; payload: User };

const initialState: AuthState = {
  isLoading: true,
  isSignout: false,
  user: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return {
        isLoading: false,
        isSignout: false,
        user: action.payload,
      };
    case 'SIGN_IN':
    case 'SIGN_UP':
      return {
        isLoading: false,
        isSignout: false,
        user: action.payload,
      };
    case 'SIGN_OUT':
      return {
        isLoading: false,
        isSignout: true,
        user: null,
      };
    default:
      return state;
  }
}

export const AuthContext = createContext<{
  state: AuthState;
  authContext: {
    requestOTP: (phone: string) => Promise<void>;
    register: (name: string, email: string, phone: string, password: string, userType: 'user' | 'responder') => Promise<void>;
    signIn: (phone: string, otp: string) => Promise<void>;
    signInWithPassword: (phone: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
  };
}>({
  state: initialState,
  authContext: {
    requestOTP: async () => {},
    register: async () => {},
    signIn: async () => {},
    signInWithPassword: async () => {},
    signOut: async () => {},
  },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const bootstrapAsync = async () => {
      let user = null;
      try {
        // Restore user session
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          user = JSON.parse(userData);
          console.log('🔄 Restoring Session. Role:', user.is_admin ? 'ADMIN' : user.is_responder ? 'RESPONDER' : 'USER');
          
          // Validate token existence
          if (user.token) {
            apiService.setAuthToken(user.token);
          }
        }
      } catch (e) {
        console.error('Failed to restore session:', e);
      }
      dispatch({ type: 'RESTORE_TOKEN', payload: user });
    };

    bootstrapAsync();
  }, []);

  const authContext = {
    requestOTP: useCallback(async (phone: string) => {
      try {
        await apiService.requestOTP(phone);
      } catch (error) {
        console.error('OTP request error:', error);
        throw error;
      }
    }, []),

    register: useCallback(async (
      name: string,
      email: string,
      phone: string,
      password: string,
      userType: 'user' | 'responder'
    ) => {
      try {
        const response = await apiService.registerUser(name, email, phone, password, userType);
        await AsyncStorage.setItem('user', JSON.stringify(response));
        apiService.setAuthToken(response.token);
        dispatch({ type: 'SIGN_UP', payload: response });
      } catch (error: any) {
        console.error('Registration error:', error);
        throw error;
      }
    }, []),

    signIn: useCallback(async (phone: string, otp: string) => {
      try {
        const response = await apiService.loginUser(phone, otp);
        await AsyncStorage.setItem('user', JSON.stringify(response));
        apiService.setAuthToken(response.token);
        dispatch({ type: 'SIGN_IN', payload: response });
      } catch (error) {
        console.error('Sign in error:', error);
        throw error;
      }
    }, []),

    signInWithPassword: useCallback(async (phone: string, password: string) => {
      try {
        const response = await apiService.loginWithPassword(phone, password);
        
        // DEBUG LOG: Check what the backend actually sent
        console.log('✅ Login Success. Admin Flag:', response.is_admin);

        await AsyncStorage.setItem('user', JSON.stringify(response));
        apiService.setAuthToken(response.token);
        dispatch({ type: 'SIGN_IN', payload: response });
      } catch (error) {
        console.error('Password sign in error:', error);
        throw error;
      }
    }, []),

    signOut: useCallback(async () => {
      try {
        await AsyncStorage.removeItem('user');
        apiService.removeAuthToken();
        dispatch({ type: 'SIGN_OUT' });
      } catch (error) {
        console.error('Sign out error:', error);
        throw error;
      }
    }, []),
  };

  return (
    <AuthContext.Provider value={{ state, authContext }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};