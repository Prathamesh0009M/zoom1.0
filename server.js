const express = require("express");
const { ExpressPeerServer } = require("peer");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/'
});

app.use('/peerjs', peerServer);

// Track rooms and their participants
const rooms = new Map();

io.on("connection", socket => {
    console.log('New socket connection:', socket.id);

    socket.on("join-room", (roomId, userId) => {
        console.log(`User ${userId} joining room ${roomId}`);
        
        // Leave previous rooms
        Array.from(socket.rooms).forEach(room => {
            if (room !== socket.id) socket.leave(room);
        });

        socket.join(roomId);
        
        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
        }
        rooms.get(roomId).add(userId);
        
        // Broadcast to others in the room
        socket.to(roomId).emit('user-connected', userId);
        console.log(`Room ${roomId} participants:`, Array.from(rooms.get(roomId)));

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`User ${userId} disconnecting from room ${roomId}`);
            const room = rooms.get(roomId);
            if (room) {
                room.delete(userId);
                if (room.size === 0) {
                    rooms.delete(roomId);
                }
                // Notify others in the room
                socket.to(roomId).emit('user-disconnected', userId);
            }
        });
        
        socket.on('name-change', (roomId, userId, newName) => {
            socket.to(roomId).emit('user-renamed', userId, newName);
        });
    });
});

const PORT = 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});























