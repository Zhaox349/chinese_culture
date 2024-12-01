// 改成本地的IP地址
const socket = io("ws://chinese-culture.onrender.com:3000");

socket.on("chat message", (msg) => {
  chatMatterMgr.add(msg.message);
});

/**
 * 发消息
 */
function onClickSend() {
  const message = $("#input")[0].value;
  socket.emit("send", { chat: message });
  $("#input")[0].value = "";
}
