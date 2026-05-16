import { useAuthStore } from '@/features/auth/hooks/useAuth';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '');

class SocketService {
  private socket: Socket | null = null;

  connect() {
    const token = useAuthStore.getState().accessToken;

    if (!token) return;

    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL!, {
      transports: ['websocket'],

      auth: {
        token,
      },

      autoConnect: true,

      reconnection: true,

      reconnectionAttempts: 10,

      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    return this.socket;
  }

  getSocket() {
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
