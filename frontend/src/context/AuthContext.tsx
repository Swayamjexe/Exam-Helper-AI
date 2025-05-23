import React, { createContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

// Define types
type User = {
  id: number;
  username: string;
  email: string;
};

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

// Create the Auth Context
export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

type AuthProviderProps = {
  children: ReactNode;
};

// API URL
const API_URL = 'http://localhost:5000/api';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check if user is already logged in on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await axios.get(`${API_URL}/auth/profile`);
          setUser(response.data.user);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Auth error:', error);
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      
      const { access_token, user } = response.data;
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      setUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Register function
  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        password,
      });
      
      const { access_token, user } = response.data;
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      setUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 