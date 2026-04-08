import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '../lib/supabase';
import api from '../lib/api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const session = ref(null);
  const loading = ref(false);

  const isAuthenticated = computed(() => !!user.value);

  async function initialize() {
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
  }

  async function signup(email, password, fullName) {
    loading.value = true;
    try {
      const response = await api.post('/auth/signup', { email, password, fullName });
      session.value = response.session;
      user.value = response.user;
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
      await supabase.auth.signOut();
      session.value = null;
      user.value = null;
      api.setAuthToken(null);
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
