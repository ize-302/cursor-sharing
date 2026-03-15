interface CursorMessage {
  sender: string;
  color: number;
  x: number;
  y: number;
  type?: string;
  id?: string;
}

(async function () {
  const ws = await connectToServer();
  document.body.onmousemove = function (event: MouseEvent) {
    const messageBody = { x: event.clientX, y: event.clientY };
    ws.send(JSON.stringify(messageBody));
  };

  function getOrCreateCursorFor(messageBody: CursorMessage): SVGSVGElement {
    const sender = messageBody.sender;
    const existing = document.querySelector<SVGSVGElement>(
      `[data-sender='${sender}']`,
    );
    if (existing) return existing;

    const cursor = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    );
    cursor.setAttribute("class", "cursor");
    cursor.setAttribute("width", "32");
    cursor.setAttribute("height", "32");
    cursor.setAttribute("viewBox", "0 0 28 28");
    cursor.setAttribute("data-sender", sender);
    cursor.innerHTML = `<path fill="hsl(${messageBody.color}, 50%, 50%)" d="M6 3.604c0-1.346 1.56-2.09 2.607-1.243l16.88 13.669c1.018.824.435 2.47-.875 2.47h-9.377a2.25 2.25 0 0 0-1.749.835l-4.962 6.134C7.682 26.51 6 25.915 6 24.576z"/>
`;
    document.body.appendChild(cursor);
    return cursor;
  }

  async function connectToServer() {
    const ws = new WebSocket(
      "ws://cursor-sharing-production.up.railway.app/ws",
    );
    return new Promise<WebSocket>((resolve, reject) => {
      const timer = setInterval(() => {
        if (ws.readyState === 1) {
          clearInterval(timer);
          resolve(ws);
        }
        if (ws.readyState === 3) {
          reject(ws);
        }
      }, 10);
    });
  }

  let myId: string | null = null;
  ws.onmessage = (websocketMessage) => {
    const messageBody = JSON.parse(websocketMessage.data);
    if (messageBody.type === "init") {
      myId = messageBody.id;
      return;
    }
    if (messageBody.sender !== myId) {
      const cursor = getOrCreateCursorFor(messageBody);
      cursor.style.transform = `translate(${messageBody.x}px, ${messageBody.y}px)`;
    }
  };
})();
