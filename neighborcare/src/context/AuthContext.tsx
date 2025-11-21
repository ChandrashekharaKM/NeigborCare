import React, { createContext, useCallback, useEffect, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import apiService from '../services/api';

type AuthState = {
  isLoading: boolean;
  isSignout: boolean;
  user: User | null;
};

type AuthAction =
  | { type: 'RESTORE_TOKEN'; payload: User }
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
    register: (name: string, email: string, phone: string, password: string, userType: 'user' | 'responder' | 'admin') => Promise<void>;
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
      try {
        // Restore user session
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          apiService.setAuthToken(user.token);
          dispatch({ type: 'RESTORE_TOKEN', payload: user });
        } else {
          dispatch({ type: 'SIGN_OUT' });
        }
      } catch (e) {
        console.error('Failed to restore session:', e);
        dispatch({ type: 'SIGN_OUT' });
      }
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
      userType: 'user' | 'responder' | 'admin'
    ) => {
      try {
        const response = await apiService.registerUser(name, email, phone, password, userType);
        await AsyncStorage.setItem('user', JSON.stringify(response));
        apiService.setAuthToken(response.token);
        dispatch({ type: 'SIGN_UP', payload: response });
      } catch (error: any) {
        console.error('Registration error:', error);
        // Provide user-friendly error message
        const errorMessage = error?.message || 'Registration failed. Please check your connection.';
        throw new Error(errorMessage);
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
