const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let tasks = [];

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Send current tasks to the newly connected client
  socket.emit("sync:tasks", tasks);

  socket.on("task:create", (newTask) => {
    const task = { ...newTask, id: Date.now().toString(), attachments: newTask.attachments || [] };
    tasks.push(task);
    io.emit("task:create", task); // Broadcast to all clients
  });

  socket.on("task:update", (updatedTask) => {
    tasks = tasks.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t));
    io.emit("task:update", updatedTask);
  });

  socket.on("task:move", ({ id, column }) => {
    tasks = tasks.map((t) => (t.id === id ? { ...t, column } : t));
    io.emit("task:move", { id, column });
  });

  socket.on("task:delete", (id) => {
    tasks = tasks.filter((t) => t.id !== id);
    io.emit("task:delete", id);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(5000, () => console.log("Server running on port 5000"));
