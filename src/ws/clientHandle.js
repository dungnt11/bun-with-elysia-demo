class ClientHandle {
  id;
  ws;
  clientConnectionManager;
  connectionState = "CLOSE";

  constructor(id, clientConnectionManager) {
    this.id = id;
    this.clientConnectionManager = clientConnectionManager;
  }

  initialize(ws) {
    if (!ws) {
      return;
    }
    this.ws = ws;
    this.connectionState = "OPEN"; // Set the state to OPEN here
  }

  isValidJSON(json) {
    json = JSON.stringify(json);
    return /^[\],:{}\s]*$/.test(
      json
        .replace(/\\["\\\/bfnrtu]/g, "@")
        .replace(
          /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
          "]"
        )
        .replace(/(?:^|:|,)(?:\s*\[)+/g, "")
    );
  }

  handleClientMessage(message) {
    if (!this.isValidJSON(message)) {
      return this.sendToClient({ ok: 0, e: "Không đúng định dạng JSON" });
    }

    const { type, content } = message;

    switch (type) {
      case "info": {
        this.sendToClient({
          type: "info",
          content: { ok: 1, d: this.id },
        });
        break;
      }
      case "devices-lists": {
        const allClient = this.clientConnectionManager.getAllClients();
        const idList = [];
        allClient.forEach((client) => {
          if (client.id !== this.id) {
            idList.push(client.id);
          }
        });
        this.sendToClient({
          type: "devices-lists",
          content: { ok: 1, d: idList },
        });
        break;
      }
      case "send-to-web-offer": {
        const { toDevice, offer } = content;
        this.clientConnectionManager.getClient(toDevice)?.sendToClient({
          type: "send-to-web-offer",
          content: {
            offer,
            fromDevice: this.id,
          },
        });
        break;
      }
      case "send-to-web-answer": {
        const { toDevice, answer } = content;
        this.clientConnectionManager.getClient(toDevice)?.sendToClient({
          type: "send-to-web-answer",
          content: {
            answer,
            fromDevice: this.id,
          },
        });
        break;
      }
      case "ice": {
        const { toDevice, ice } = content;
        this.clientConnectionManager.getClient(toDevice)?.sendToClient({
          type: "ice",
          content: {
            ice,
          },
        });
        break;
      }
      case "start": {
        const { toDevice, fromDevice } = content;
        this.clientConnectionManager.getClient(toDevice)?.sendToClient({
          type: "start",
          content: {
            fromDevice,
          },
        });
        break;
      }
      case "stop": {
        const { toDevice } = content;
        this.clientConnectionManager.getClient(toDevice)?.sendToClient({
          type: "stop",
          content: {},
        });
        break;
      }
      case "actionmouse": {
        const { toDevice, type, x, y } = content;
        this.clientConnectionManager.getClient(toDevice)?.sendToClient({
          type: "actionmouse",
          content: { type, x, y },
        });
        break;
      }
      case "action": {
        const { toDevice } = content;
        this.clientConnectionManager.getClient(toDevice)?.sendToClient({
          type: "action",
          content: {
            type: content.type,
          },
        });
      }
      case "start_stream_socket": {
        const { toDevice, fromDevice } = content;
        this.clientConnectionManager.getClient(toDevice)?.sendToClient({
          type: "start_stream_socket",
          content: { fromDevice },
        });
        break;
      }
      case "frame_stream_socket": {
        const { toDevice, image } = content;
        this.clientConnectionManager.getClient(toDevice)?.sendToClient({
          type: "frame_stream_socket",
          content: { image },
        });
        break;
      }
      case "stop_stream_socket": {
        const { toDevice } = content;
        this.clientConnectionManager.getClient(toDevice)?.sendToClient({
          type: "stop_stream_socket",
          content: {},
        });
        break;
      }
      default:
        break;
    }
  }

  handleClientDisconnection() {
    this.clientConnectionManager.removeClient(this.id.toString());
    this.connectionState = "CLOSED";
  }

  sendToClient(data) {
    try {
      if (this.ws && this.connectionState === "OPEN") {
        this.ws.send(JSON.stringify(data));
      } else {
        this.clientConnectionManager.removeClient(this.id.toString());
      }
    } catch (error) {
      // Handle error
    }
  }

  close() {
    try {
      if (this.ws && this.ws.readyState === this.ws.OPEN) {
        this.sendToClient({
          type: "a_device_disconnect",
          content: {
            device: this.id,
          },
        });
        this.ws.close();
      }
    } catch (error) {}
  }
}

export default ClientHandle;
