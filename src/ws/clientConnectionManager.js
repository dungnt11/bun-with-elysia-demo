export default class ClientConnectionManager {
  instance;
  clients = new Map()

  getClient(id) {
    return this.clients.get(id)
  }

  addClient(id, client)  {
    if (client.connectionState !== 'OPEN') {
      console.warn(`WebSocket is not open for client ${id}. Retrying...`)
      setTimeout(() => this.addClient(id, client), 100) // Retry after 100ms
      return
    }
    this.clients.set(id, client)
  }

  removeClient(id) {
    const client = this.clients.get(id)
    if (!client) {
      return
    }

    // Close the WebSocket, regardless of its state
    client.close()

    // Remove from all maps
    this.clients.delete(id)
  }

  isClientActive(id) {
    const client = this.clients.get(id)
    return client !== undefined && client.connectionState === 'OPEN'
  }

  getAllClients() {
    return Array.from(this.clients.values()).filter(
      (clientHandler) => clientHandler.ws.raw.readyState === WebSocket.OPEN,
    )
  }
}