const { WebSocket, WebSocketServer } = require("ws");

const wss = new WebSocketServer({ port: 1234 });

let id = 1;

wss.on("connection", function connection(ws) {
    ws.isAlive = true;
    ws.id = id++;
    ws.on("pong", function() {
        this.isAlive = true;
    });
    ws.on("message", function handler(data) {
        wss.clients.forEach((client) => {
            if(client.readyState === WebSocket.OPEN) {
                client.send(ws.id+" "+data);
            }
        });
    });
    ws.send(""+ws.id);
});

const interval = setInterval(function ping() {
    wss.clients.forEach(function(ws) {
        if(ws.isAlive === false) return ws.terminate();

        ws.isAlive = false;
        ws.ping();
    });
}, 30000);
wss.on("close", function() {
    clearInterval(interval);
});
wss.on("listening", function() {
    console.log(`Websocket server listening`);
});