import { create } from 'zustand'

export interface User {
  id: string
  username: string
  role: 'superadmin' | 'user'
  name: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

const mockUsers: User[] = [
  {
    id: '1',
    username: 'SuperAdmin',
    role: 'superadmin',
    name: 'Super Admin'
  },
  {
    id: '2',
    username: 'user123',
    role: 'user',
    name: 'John Doe'
  }
]

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (username: string, password: string) => {
    // Mock authentication with hardcoded demo accounts
    if ((username === 'SuperAdmin' && password === 'SuperAdmin') ||
        (username === 'user123' && password === 'user123')) {
      const user = mockUsers.find(u => u.username.toLowerCase() === username.toLowerCase())
      if (user) {
        set({ user, isAuthenticated: true })
        return true
      }
    }
    return false
  },
  logout: () => {
    set({ user: null, isAuthenticated: false })
  }
}))
