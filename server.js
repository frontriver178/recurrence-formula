// server.js
const path    = require('path');
const os      = require('os');
const express = require('express');
const fs      = require('fs');
const { exec }= require('child_process');
const problems= require('./problems.json');

const PORT = process.env.PORT || 3001;
console.log('▶️ server.js start');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// カテゴリ別プロンプトマップ
const prompts = {
  数列:    '次の問いに答えよ.ただし漸化式が与えられた問題については一般項を $n$ を用いて答えよ.',
  ベクトル: '次の問いに答えよ．',
  積分法:  '次の問いに答えよ.ただし不定積分が与えられている場合には積分定数をCとせよ.',
  無機化学: '次の反応の化学反応式を答えよ.',
  default: '次の問いに答えよ.'
};

app.post('/generate-mix', (req, res) => {
  const { category, lvl1, lvl2 } = req.body;
  const counts = { 1: +lvl1, 2: +lvl2 };
  console.log('counts:', counts);

  const filtered = problems.filter(p => p.category === category);
  const selected = [];
  for (const [level, cnt] of Object.entries(counts)) {
    const pool = filtered.filter(p => p.difficulty === +level);
    const pickCount = Math.min(pool.length, cnt);
    for (let i = 0; i < pickCount; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      selected.push(pool.splice(idx, 1)[0]);
    }
  }

  const description = prompts[category] || prompts.default;
  const title = `【${category}ガチャ】`;

  const tex = `\\documentclass[10pt]{ltjarticle}
\\usepackage[a4paper,left=15mm,right=15mm,top=15mm,bottom=20mm,footskip=10mm]{geometry}
\\usepackage{luatexja,amsmath,amssymb,enumitem}
\\usepackage{mhchem}
\\renewcommand{\\d}{\\displaystyle}
\\setlist[enumerate]{itemsep=1.5\\baselineskip,topsep=1\\baselineskip}

\\title{${title}}
\\date{\\empty}
\\author{阪大数学bot}

\\begin{document}
\\maketitle

\\section*{問題}
${description}
\\begin{enumerate}[label=\\textbf{\\fbox{\\arabic*}}]
${selected.map(p => `  \\item ${p.latex}`).join('\n')}
\\end{enumerate}

\\newpage
\\section*{解答}
\\begin{enumerate}[label=\\textbf{\\fbox{\\arabic*}}]
${selected.map(p => `  \\item ${p.answer || '（解答未登録）'}`).join('\n')}
\\end{enumerate}
\\end{document}`;

  const tmpDir = '/tmp';
  const texPath = path.join(tmpDir, 'output.tex');
  const pdfPath = path.join(tmpDir, 'output.pdf');

  fs.writeFileSync(texPath, tex);
  exec('lualatex -interaction=nonstopmode output.tex', { cwd: tmpDir }, err => {
    if (err) {
      console.error('LaTeX変換失敗:', err);
      return res.status(500).send("LaTeX変換失敗");
    }
    const out = path.join(__dirname, 'public', 'output.pdf');
    fs.copyFileSync(pdfPath, out);
    res.send("OK");
  });
});

app.get('/download', (req, res) => {
  const out = path.join(__dirname, 'public', 'output.pdf');
  if (fs.existsSync(out)) {
    res.download(out, 'output.pdf');
  } else {
    res.status(404).send("PDF未生成");
  }
});

// エラー時のハンドリング
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`▶️ サーバー起動: http://localhost:${PORT}`);
});
server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`ポート${PORT}は使用中です。別ポートを指定してください。`);
    process.exit(1);
  }
});
