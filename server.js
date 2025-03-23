const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3001;

// 서버 요청 로깅 미들웨어 (맨 위에 추가)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// 미들웨어 설정
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500'], // Live Server 호스트 명시적 허용
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // 쿠키 전송 허용 (필요한 경우)
}));
app.use(bodyParser.json());

// 디버깅 로그 추가
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - 바디:`, req.body);
  next();
});

// MongoDB 연결 정보
const uri = "mongodb+srv://coq3820:JmbIOcaEOrvkpQo1@cluster0.qj1ty.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

// 서버 시작 시 기본 컬렉션 생성 함수
async function ensureDefaultCollection() {
  try {
    const db = client.db('insta09_database');
    // 컬렉션이 없으면 기본 컬렉션 생성
    const collections = await db.listCollections().toArray();
    
    // 기본 컬렉션 이름 변경
    const defaultCollectionName = 'mandala_default';
    
    // 기본 컬렉션 존재 여부 확인
    const defaultExists = collections.some(c => c.name === defaultCollectionName);
    
    if (!defaultExists) {
      console.log('기본 컬렉션 생성 중...');
      await db.createCollection(defaultCollectionName);
      console.log('기본 컬렉션 생성 완료');
    } else {
      console.log('기존 기본 컬렉션이 이미 존재합니다');
    }
    
    console.log('기존 컬렉션 목록:', collections.map(c => c.name).join(', '));
  } catch (error) {
    console.error('기본 컬렉션 생성 오류:', error);
  }
}

// MongoDB 연결 초기화 함수 수정
async function initMongoDB() {
  try {
    await client.connect();
    console.log("MongoDB에 연결되었습니다!");
    
    // 테스트 컬렉션 생성
    const db = client.db('insta09_database');
    try {
      await db.createCollection('mandala_test_' + Date.now());
      console.log('테스트 컬렉션 생성됨');
    } catch (err) {
      console.log('컬렉션 생성 중 오류(무시 가능):', err.message);
    }
    
    // 기본 컬렉션 확인
    await ensureDefaultCollection();
  } catch (error) {
    console.error("MongoDB 연결 오류:", error);
    process.exit(1);
  }
}

// 서버 시작 시 MongoDB 연결 초기화
initMongoDB();

// 데이터 불러오기 API
app.get('/api/mandalart/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { collection } = req.query;
    
    // 컬렉션 이름을 받아서 사용 (기본값 변경)
    const collectionName = collection || 'mandala_default';
    
    const db = client.db('insta09_database');
    const collectionRef = db.collection(collectionName);
    
    const data = await collectionRef.findOne({ userId });
    
    if (data) {
      res.json(data);
    } else {
      res.status(404).json({ message: "데이터를 찾을 수 없습니다" });
    }
  } catch (error) {
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
});

// 데이터 저장 API
app.post('/api/mandalart/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { collection } = req.query;
    const mandalartData = req.body;
    
    console.log(`저장 요청 받음: 사용자 ${userId}, 컬렉션 ${collection || 'mandala_default'}`);
    
    // 컬렉션 이름을 받아서 사용
    const collectionName = collection || 'mandala_default';
    
    const db = client.db('insta09_database');
    
    // 컬렉션 존재 여부 확인
    const collections = await db.listCollections({name: collectionName}).toArray();
    
    // 데이터 존재 여부 확인
    const existingData = await db.collection(collectionName).findOne({ userId });
    
    // 이미 해당 이름의 컬렉션이 있고 데이터가 있으면 오류 반환
    if (collections.length > 0 && existingData && req.query.checkExisting === 'true') {
      return res.status(409).json({
        success: false,
        message: '이미 존재하는 컬렉션입니다. 다른 이름을 입력해주세요.'
      });
    }
    
    const collectionRef = db.collection(collectionName);
    
    const result = await collectionRef.updateOne(
      { userId },
      { $set: { ...mandalartData, updatedAt: new Date() }},
      { upsert: true }
    );
    
    console.log(`저장 완료: ${collectionName}, 결과:`, result);
    
    res.json({ 
      success: true, 
      message: `데이터가 ${collectionName} 컬렉션에 저장되었습니다` 
    });
  } catch (error) {
    console.error('저장 중 서버 오류:', error);
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
});

// 컬렉션 목록 조회 API
app.get('/api/collections', async (req, res) => {
  try {
    // 요청에서 prefix 파라미터 가져오기
    const { prefix } = req.query;
    console.log('컬렉션 조회 요청 - 접두사:', prefix);
    
    // MongoDB 데이터베이스 참조
    const db = client.db('insta09_database');
    
    // 모든 컬렉션 목록 가져오기
    const collections = await db.listCollections().toArray();
    console.log('전체 컬렉션 목록:', collections.map(c => c.name));
    
    // 접두사 필터 결정
    let filterPrefix = 'mandala_';
    if (prefix === 'goya') {
      filterPrefix = 'mandala_goya_';
    } else if (prefix === 'lucy') {
      filterPrefix = 'mandala_lucy_';
    }
    
    console.log('필터링 접두사:', filterPrefix);
    
    // 컬렉션 이름만 추출하고 필터링
    const collectionNames = collections
      .map(collection => collection.name)
      .filter(name => {
        const matched = name.startsWith(filterPrefix);
        console.log(`컬렉션 ${name}: ${matched ? '일치' : '불일치'}`);
        return matched;
      });
    
    console.log(`필터링된 ${filterPrefix} 컬렉션 목록:`, collectionNames);
    
    res.json({ 
      success: true, 
      collections: collectionNames 
    });
  } catch (error) {
    console.error('컬렉션 목록 조회 중 오류:', error);
    res.status(500).json({ message: "서버 오류", error: error.message });
  }
});

// MongoDB 연결 확인 API 추가
app.get('/api/status', async (req, res) => {
  try {
    // 연결 상태 확인
    if (client.topology && client.topology.isConnected()) {
      // 데이터베이스 목록 조회
      const admin = client.db().admin();
      const dbInfo = await admin.listDatabases();
      
      res.json({
        connected: true,
        message: 'MongoDB에 연결되었습니다',
        databases: dbInfo.databases.map(db => db.name)
      });
    } else {
      await client.connect(); // 재연결 시도
      res.json({
        connected: true,
        message: '재연결에 성공했습니다'
      });
    }
  } catch (error) {
    console.error('MongoDB 연결 상태 확인 오류:', error);
    res.status(500).json({
      connected: false,
      message: '연결 실패',
      error: error.message
    });
  }
});

// 기본 라우트 추가
app.get('/', (req, res) => {
  res.send('만다라트 API 서버가 실행 중입니다');
});

app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다`);
}); 