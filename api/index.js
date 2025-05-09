const serverless = require('serverless-http');
const express   = require('express');
const app       = express();

// ミドルウェア例（JSON の自動パース）
app.use(express.json());

// エンドポイント定義
app.get('/users', (req, res) => {
  // → ブラウザで https://<あなたのドメイン>/api/users にアクセスすると実行される
  res.json([{ id: 1, name: 'Taro' }]);
});

// Express アプリをサーバーレス形式に変換してエクスポート
module.exports = serverless(app);
