import { Server } from 'socket.io';

import { Server as HttpServer } from 'http';

import { AuthenticatedSocket, socketAuthMiddleware } from './socket-auth-middleware';

let io: Server;

export function initializeSocketServer(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
    },

    transports: ['websocket'],
  });

  /*
    Auth middleware
  */

  io.use(socketAuthMiddleware);

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.user?.id;

    console.log(`✅ Socket connected: ${userId}`);

    /*
        User room
      */

    socket.join(`user:${userId}`);

    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${userId}`);
    });
  });

  return io;
}

/*
  Emit helper
*/

export function emitNotification(userId: string, notification: unknown) {
  try {
    io.to(`user:${userId}`).emit('notification:new', notification);
  } catch (error) {
    console.log('error is ', error);
  }
}
