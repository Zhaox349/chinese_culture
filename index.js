const express = require("express");

const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const path = require("path");

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(`${__dirname}/index.html`);
});

io.on("connection", (socket) => {
  socket.on("send", (msg) => {
    io.sockets.emit("chat message", {
      message: msg.chat,
    });
  });
  socket.on("disconnect", () => {});
});

http.listen(3000, () => {
  console.log("listening in the year *:3000");
});
