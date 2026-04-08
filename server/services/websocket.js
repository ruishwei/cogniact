import { v4 as uuidv4 } from 'uuid';

const connections = new Map();

export function handleWebSocketConnection(ws, req) {
  const connectionId = uuidv4();

  console.log(`WebSocket connection established: ${connectionId}`);

  connections.set(connectionId, {
    ws,
    userId: null,
    agentId: null,
    conversationId: null,
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleWebSocketMessage(connectionId, message);
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Invalid message format',
      }));
    }
  });

  ws.on('close', () => {
    console.log(`WebSocket connection closed: ${connectionId}`);
    connections.delete(connectionId);
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error [${connectionId}]:`, error);
  });

  ws.send(JSON.stringify({
    type: 'connected',
    connectionId,
  }));
}

function handleWebSocketMessage(connectionId, message) {
  const connection = connections.get(connectionId);

  if (!connection) {
    return;
  }

  const { ws } = connection;

  switch (message.type) {
    case 'authenticate':
      connection.userId = message.userId;
      ws.send(JSON.stringify({
        type: 'authenticated',
        userId: message.userId,
      }));
      break;

    case 'subscribe_conversation':
      connection.conversationId = message.conversationId;
      connection.agentId = message.agentId;
      ws.send(JSON.stringify({
        type: 'subscribed',
        conversationId: message.conversationId,
      }));
      break;

    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;

    default:
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Unknown message type',
      }));
  }
}

export function broadcastToConversation(conversationId, message) {
  for (const [connectionId, connection] of connections.entries()) {
    if (connection.conversationId === conversationId) {
      connection.ws.send(JSON.stringify(message));
    }
  }
}

export function sendToUser(userId, message) {
  for (const [connectionId, connection] of connections.entries()) {
    if (connection.userId === userId) {
      connection.ws.send(JSON.stringify(message));
    }
  }
}
