import index from "./public/index.html";
const clients = new Map();

const server = Bun.serve({
  port: 8080,
  routes: {
    "/": index,
  },
  fetch(req, server): Response | Promise<Response> | undefined {
    const url = new URL(req.url);

    if (url.pathname === "/ws") {
      const upgraded = server.upgrade(req);
      if (upgraded) {
        return undefined;
      }
      return new Response("upgrade to websocket failed", { status: 400 });
    }
    return new Response("Websocket server running");
  },
  websocket: {
    open(ws) {
      const id = crypto.randomUUID();
      const color = Math.floor(Math.random() * 360);
      const metadata = { id, color };
      clients.set(ws, metadata);
      ws.send(JSON.stringify({ type: "init", id }));
      console.log("user: " + id + " is connected!");
    },
    message(ws, message) {
      try {
        const msg = JSON.parse(message.toString());
        const metadata = clients.get(ws);

        msg.sender = metadata.id;
        msg.color = metadata.color;

        const outbound = JSON.stringify(msg);
        [...clients.keys()].forEach((client) => {
          client.send(outbound);
        });
        ws.send(JSON.stringify(msg));
      } catch (e) {}
    },
    close(ws, _code, _message) {
      console.log("Connection closed");
      clients.delete(ws);
    },
    drain(_ws) {
      console.log("Socket drained");
    },
  },
});
console.log(`🚀 WebSocket server running at ${server.url.origin}`);
console.log(`Awaiting connections...\n`);
