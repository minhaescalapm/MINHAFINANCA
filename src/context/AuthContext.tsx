import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Usuario } from '../types';
import {
  authenticateUser,
  registerUser,
  getSupabaseCredentials,
} from '../lib/supabase';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (telefone: string, senha: string) => Promise<boolean>;
  register: (nome: string, telefone: string, senha: string) => Promise<boolean>;
  quickDemoLogin: (tipo?: 'comandante' | 'pj') => Promise<void>;
  logout: () => void;
  updateUserAvatar: (avatarUrl: string) => void;
  supabaseConfig: { url: string; anonKey: string; isCustom: boolean };
  refreshConfig: () => void;
}

const STORAGE_AUTH_USER = 'gpwa_authenticated_user_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [supabaseConfig, setSupabaseConfig] = useState(getSupabaseCredentials());
  const { showSuccess, showError, showInfo } = useToast();

  const refreshConfig = useCallback(() => {
    setSupabaseConfig(getSupabaseCredentials());
  }, []);

  // Check saved session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_AUTH_USER);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id && parsed.telefone) {
          setUser(parsed);
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar sessão de usuário:', e);
      localStorage.removeItem(STORAGE_AUTH_USER);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (telefone: string, senha: string): Promise<boolean> => {
      setIsLoading(true);
      try {
        const result = await authenticateUser(telefone, senha);

        if (result.error || !result.user) {
          showError('Falha no Login', result.error || 'Telefone ou senha inválidos.');
          setIsLoading(false);
          return false;
        }

        // Login Bem-sucedido
        setUser(result.user);
        localStorage.setItem(STORAGE_AUTH_USER, JSON.stringify(result.user));
        showSuccess(`Bem-vindo, ${result.user.nome.split(' ')[0]}!`, 'Acesso autenticado com sucesso.');
        setIsLoading(false);
        return true;
      } catch (err: any) {
        showError('Erro de Autenticação', err?.message || 'Ocorreu um erro ao consultar o Supabase.');
        setIsLoading(false);
        return false;
      }
    },
    [showSuccess, showError]
  );

  const register = useCallback(
    async (nome: string, telefone: string, senha: string): Promise<boolean> => {
      setIsLoading(true);
      try {
        const result = await registerUser(nome, telefone, senha);

        if (result.error || !result.user) {
          showError('Erro no Cadastro', result.error || 'Não foi possível registrar o usuário.');
          setIsLoading(false);
          return false;
        }

        setUser(result.user);
        localStorage.setItem(STORAGE_AUTH_USER, JSON.stringify(result.user));
        showSuccess('Conta Criada com Sucesso!', `Bem-vindo ao sistema, ${result.user.nome}.`);
        setIsLoading(false);
        return true;
      } catch (err: any) {
        showError('Erro no Registro', err?.message || 'Falha ao registrar novo usuário.');
        setIsLoading(false);
        return false;
      }
    },
    [showSuccess, showError]
  );

  const quickDemoLogin = useCallback(
    async () => {
      await login('21975151937', '050805');
    },
    [login]
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_AUTH_USER);
    showInfo('Sessão Encerrada', 'Você saiu com segurança do aplicativo.');
  }, [showInfo]);

  const updateUserAvatar = useCallback((avatarUrl: string) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, avatar_url: avatarUrl };
      localStorage.setItem(STORAGE_AUTH_USER, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        quickDemoLogin,
        logout,
        updateUserAvatar,
        supabaseConfig,
        refreshConfig,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
