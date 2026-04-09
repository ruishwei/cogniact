import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase, isSupabaseMode } from '../lib/supabase';
import api from '../lib/api';

const TOKEN_KEY = 'cloud_agent_token';
const USER_KEY = 'cloud_agent_user';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const session = ref(null);
  const loading = ref(false);

  const isAuthenticated = computed(() => !!user.value);

  async function initialize() {
    if (isSupabaseMode && supabase) {
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (currentSession) {
        session.value = currentSession;
        user.value = currentSession.user;
        api.setAuthToken(currentSession.access_token);
      }

      supabase.auth.onAuthStateChange((event, currentSession) => {
        (async () => {
          session.value = currentSession;
          user.value = currentSession?.user || null;
          if (currentSession?.access_token) {
            api.setAuthToken(currentSession.access_token);
          }
        })();
      });
    } else {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      const savedUser = localStorage.getItem(USER_KEY);
      if (savedToken && savedUser) {
        try {
          user.value = JSON.parse(savedUser);
          session.value = { access_token: savedToken };
          api.setAuthToken(savedToken);
        } catch {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
      }
    }
  }

  async function signup(email, password, fullName) {
    loading.value = true;
    try {
      const response = await api.post('/auth/signup', { email, password, fullName });
      session.value = response.session;
      user.value = response.user;
      if (response.session?.access_token) {
        api.setAuthToken(response.session.access_token);
        if (!isSupabaseMode) {
          localStorage.setItem(TOKEN_KEY, response.session.access_token);
          localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        }
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      loading.value = false;
    }
  }

  async function login(email, password) {
    loading.value = true;
    try {
      const response = await api.post('/auth/login', { email, password });
      session.value = response.session;
      user.value = response.user;
      api.setAuthToken(response.session.access_token);
      if (!isSupabaseMode) {
        localStorage.setItem(TOKEN_KEY, response.session.access_token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    loading.value = true;
    try {
      await api.post('/auth/logout');
      if (isSupabaseMode && supabase) {
        await supabase.auth.signOut();
      }
      session.value = null;
      user.value = null;
      api.setAuthToken(null);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      loading.value = false;
    }
  }

  return {
    user,
    session,
    loading,
    isAuthenticated,
    initialize,
    signup,
    login,
    logout,
  };
});
