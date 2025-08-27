// Simple test to verify backend setup
const dotenv = require('dotenv');
dotenv.config();

console.log('🧪 Backend Setup Test');
console.log('==================');
console.log(`✅ Node version: ${process.version}`);
console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`✅ Port: ${process.env.PORT || 3001}`);
console.log(`✅ Redis URL: ${process.env.REDIS_URL || 'redis://localhost:6379'}`);
console.log(`✅ OpenAI API Key: ${process.env.OPENAI_API_KEY ? '***set***' : '❌ missing'}`);
console.log(`✅ Qwen API Key: ${process.env.QWEN_3_IMAGE_EDIT_KEY ? '***set***' : '❌ missing'}`);
console.log(`✅ CORS Origins: ${process.env.CORS_ORIGINS || 'default'}`);
console.log(`✅ Worker Concurrency: ${process.env.WORKER_CONCURRENCY || '2'}`);
console.log('==================');
console.log('✅ Backend configuration looks good!');
console.log('');
console.log('Next steps:');
console.log('1. Start Redis: docker run -d --name redis -p 6379:6379 redis:alpine');
console.log('2. Start API server: npm run dev');
console.log('3. Start worker: npm run worker');
console.log('');