// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();

app.use(
  cors({
    // origin: ["http://localhost:5173", "http://localhost:80","http://localhost:443" , "http://localhost:4173" ],
    origin:"http://localhost",
    methods: ["GET", "POST", "PUT"],
    credentials: true,
  })
);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
   
    origin:"http://localhost",
    methods: ["GET", "POST", "PUT"],
    credentials: true,
  },
});

const users = new Set(); // To store online users

// app.use(express.static(path.join(__dirname, 'public')));

// Handle Socket.IO connections
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Notify other users that a new user has joined
  users.add(socket.id);
  io.emit("users:joined", socket.id);
  console.log("user joined:", socket.id);
  // Send the current list of users to the newly connected user
  socket.emit("hello", { id: socket.id });
  io.emit("users:update", Array.from(users));

  // Handle incoming calls
  socket.on("outgoing:call", (data) => {
    console.log("outgoing call");
    io.to(data.to).emit("incoming:call", {
      from: socket.id,
      offer: data.fromOffer,
    });
  });

  socket.on("call:rejected", (data) => {
    const { to } = data;
    // Notify the caller that the call was rejected
    io.to(to).emit("call:rejected", {
      message: "Call was rejected by the recipient.",
    });
    console.log(`Call rejected by ${socket.id}, notifying ${to}`);
  });

  socket.on("mute", (data) => {
    // Broadcast the mute/unmute event to other users
    socket.broadcast.emit("user-muted", {
      userId: socket.id,
      isMuted: data.isMuted,
    });
    console.log("muted");
  });

  // Handle incoming answers
  socket.on("call:accepted", (data) => {
    console.log("call   accepted");
    io.to(data.to).emit("incoming:answer", { offer: data.answer });
  });

  socket.on("error", (err) => {
    console.log(err);
  });

  socket.on('call:hangup', ({ to }) => {
    // Notify the other peer that the call has been hung up
    io.to(to).emit('call:hangup');
    console.log(`Call hung up by ${socket.id}, notifying ${to}`);
  });

  // Handle user disconnections
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    users.delete(socket.id);
    io.emit("user:disconnect", socket.id);
    io.emit("users:update", Array.from(users));
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
