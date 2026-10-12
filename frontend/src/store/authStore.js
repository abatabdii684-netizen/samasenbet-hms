import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true }),

      setUser: (user) => set({ user }),

      setAccessToken: (accessToken) => set({ accessToken }),

      logout: () =>
        set({ user: null, accessToken: null, isAuthenticated: false }),

      setLoading: (isLoading) => set({ isLoading }),

      // Permission helpers — CEO/admin roles bypass all checks
      hasPermission: (permission) => {
        const { user } = get();
        if (!user) return false;
        const superRoles = ['CEO', 'ADMIN_FINANCE', 'MEDICAL_DIRECTOR', 'MEDICAL_SUPERVISOR', 'super_admin', 'admin'];
        if (superRoles.includes(user?.role?.name)) return true;
        return user?.permissions?.includes(permission) ?? false;
      },

      hasAnyPermission: (...permissions) => {
        const { user } = get();
        if (!user) return false;
        const superRoles = ['CEO', 'ADMIN_FINANCE', 'MEDICAL_DIRECTOR', 'MEDICAL_SUPERVISOR', 'super_admin', 'admin'];
        if (superRoles.includes(user?.role?.name)) return true;
        return permissions.some((p) => user?.permissions?.includes(p));
      },

      hasRole: (...roles) => {
        const { user } = get();
        return roles.includes(user?.role?.name);
      },
    }),
    {
      name: 'samasenbet-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
