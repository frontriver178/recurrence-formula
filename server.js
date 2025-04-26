// server.js
const express = require('express');
const fs = require('fs');
const { exec } = require('child_process');
const app = express();
const problems = require('./problems.json');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.post('/generate-mix', (req, res) => {
  // ① リクエストからパラメータ取得
  const { category, lvl1, lvl2 } = req.body;

  // ② counts を定義してすぐログ
  const counts = {
    1: parseInt(lvl1, 10),
    2: parseInt(lvl2, 10)
  };
  console.log('counts:', counts);

  // ③ filtered を定義してログ
  const filtered = problems.filter(p => p.category === category);
  console.log('filtered IDs:', filtered.map(p => p.id));

  // ④ 各レベルの pool サイズをログしつつ抽出
  const selected = [];
  for (const [level, cnt] of Object.entries(counts)) {
    const pool = filtered.filter(p => p.difficulty === Number(level));
    console.log(`level ${level} pool size:`, pool.length);
    for (let i = 0; i < Math.min(pool.length, cnt); i++) {
      const idx = Math.floor(Math.random() * pool.length);
      selected.push(pool[idx]);
      pool.splice(idx, 1);
    }
  }

  // ⑤ LaTeX 組み立て
  const tex = `\\documentclass{ltjsarticle}
\\usepackage{luatexja}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{enumitem}

\\begin{document}

次の漸化式を解け.\n

\\begin{enumerate}\[label=(\\arabic*)\]

${selected.map(p => `  \\item ${p.latex.trim()}`).join('\n\n')}

\\end{enumerate}

\\bigskip
\\noindent 出典：${selected.map(p => p.id).join('，')}

\\end{document}`;

  // ⑥ ファイル書き出し & PDF 生成
  fs.writeFileSync('output.tex', tex);
  exec('lualatex output.tex', err => {
    if (err) return res.status(500).send("LaTeX変換失敗");
    fs.copyFileSync(__dirname + '/output.pdf', __dirname + '/public/output.pdf');
    res.send("PDF生成完了!");
  });
});

app.listen(3000, () => console.log('http://localhost:3000 で起動中'));
