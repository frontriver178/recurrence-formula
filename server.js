console.log('▶️ server.js start');

const os      = require('os');
const express = require('express');
const fs      = require('fs');
const { exec }= require('child_process');
const problems= require('./problems.json');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// カテゴリ別プロンプトマップはハンドラ外で１回だけ定義
const prompts = {
  数列:   '次の問いに答えよ.ただし漸化式が与えられた問題については一般項を $n$ を用いて答えよ.',
  ベクトル:'次の問いに答えよ．',
  積分法: '次の問いに答えよ.ただし不定積分が与えられている場合には積分定数をCとせよ.',
  無機化学:'次の反応の化学反応式を答えよ.',
  default:'次の問いに答えよ.'
};

app.post('/generate-mix', (req, res) => {
  const { category, lvl1, lvl2 } = req.body;

  // ① 数取得
  const counts = { 1: +lvl1, 2: +lvl2 };
  console.log('counts:', counts);

  // ② フィルタ＆ランダム抽選
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

  // ③ 説明文とタイトル
  const description = prompts[category] || prompts.default;
  const title = `【${category}ガチャ】`;

  // ④ LaTeX組み立て
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

  // ⑤ ファイル出力＆PDF生成
  fs.writeFileSync('output.tex', tex);
  exec('lualatex -interaction=nonstopmode output.tex', err => {
    if (err) return res.status(500).send("LaTeX変換失敗");
    fs.copyFileSync(__dirname + '/output.pdf', __dirname + '/public/output.pdf');
    res.send("PDF生成完了!");
  });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  const { address, port } = server.address();
  const host = (address === '::' || address === '0.0.0.0') ? 'localhost' : address;
  console.log(`▶️ サーバー起動: http://${host}:${port}`);
});
