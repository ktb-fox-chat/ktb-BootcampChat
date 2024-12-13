require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const { router: roomsRouter, initializeSocket } = require('./routes/api/rooms');
const routes = require('./routes');
const Room = require('./models/Room');
const RoomCacheHandler = require('./utils/roomhandler')
const MessageCacheHandler = require('./utils/messagehandler')
const Shutdown = require('./middleware/shutdown');
const Message = require('./models/Message');
const redisClient = require('./utils/redisClient');
const { syncCacheData } = require('./utils/syncDBHandler')

const app = express();
const server = http.createServer(app);
const PORT = process.env.SERVER_PORT || 5000;

// trust proxy 설정 추가
app.set('trust proxy', 1);

// CORS 설정
const corsOptions = {
  origin: [
    'https://bootcampchat-fe.run.goorm.site',
    'http://localhost:3000',
    'https://localhost:3000',
    'http://0.0.0.0:3000',
    'https://0.0.0.0:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'x-auth-token', 
    'x-session-id',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['x-auth-token', 'x-session-id']
};

// 기본 미들웨어
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// OPTIONS 요청에 대한 처리
app.options('*', cors(corsOptions));

// 정적 파일 제공
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 요청 로깅
if (process.env.MODE === 'dev') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
} else if(process.env.MODE) {
  console.debug = () => {}
}

// 기본 상태 체크
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.MODE
  });
});

// health-check 전용 CORS 옵션
const healthCheckCorsOptions = {
  origin: '*',  // 모든 출처 허용
  methods: ['GET'],  // health check는 GET 메서드만 허용
};

// health 라우트에 별도의 CORS 미들웨어 적용
app.get('/health-check', cors(healthCheckCorsOptions), (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.MODE
  });
});

app.get('/shutdown', Shutdown)

// API 라우트 마운트
app.use('/api', routes);

// Socket.IO 설정
const io = socketIO(server, { cors: corsOptions });
require('./sockets/chat')(io);

// Socket.IO 객체 전달
initializeSocket(io);

// 404 에러 핸들러
app.use((req, res) => {
  console.log('404 Error:', req.originalUrl);
  res.status(404).json({
    success: false,
    message: '요청하신 리소스를 찾을 수 없습니다.',
    path: req.originalUrl
  });
});

// 글로벌 에러 핸들러
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '서버 에러가 발생했습니다.',
    ...(process.env.MODE === 'dev' && { stack: err.stack })
  });
});

// 예외 상황 발생 시, 레디스 연결 종료 및 데이터 저장
// signal 이벤트는 감지하여도 동기를 보장해주지 않아 따로 처리하진 않았습니다.
// shutdown 라우트를 통해 요청을 보내는 형식으로 이를 대체하였습니다.
process.on('uncaughtException', async (err) => {
  console.error('Uncaught exception:', err);
  console.log("Starting disconnect redis...")
  await redisClient.quit();
  await syncCacheData()
  console.log('Redis connection closed due to error');
  process.exit(1);
});
//


// 서버 시작
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
      console.log('MongoDB Connected');
      server.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
        console.log('API Base URL:', `http://0.0.0.0:${PORT}/api`);
      });

      // 몽고디비에 적재된 데이터를 조회하고 캐시데이터에 동기화 합니다.
      Room
      .find()
      .then(async (rooms) => {
        for(let i=0; i<rooms.length; ++i) {
          const room = rooms[i]
          if(!room._id) continue

          RoomCacheHandler.upsert({
            ...room._doc,
            _id: room._id.toString(),
          })
        }
      })
    })

    // const messageCollection = {}
    // Message
    // .find()
    // .then(async (messages) => {
    //   for(let i=0; i<messages.length; ++i) {
    //     const message = messages[i]
    //     if(!messageCollection[message.room]) messageCollection[message.room] = []
    //     messageCollection[message.room].push(message)
    //   }
    //   MessageCacheHandler.set(messageCollection)
    // })
  .catch(err => {
    console.error('Server startup error:', err);
    process.exit(1);
  });

module.exports = { app, server };