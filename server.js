// server.js
// server.js の最後あたり
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`▶️ Listening on port ${PORT}`);
});

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
    const pickCount = Math.min(pool.length, cnt);
  for (let i = 0; i < pickCount; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    selected.push(pool[idx]);
    pool.splice(idx, 1);
}

  }

  // ⑤ LaTeX 組み立て
// （タイトルを動的に）
let title = '定着度確認テスト';
if (category === '数列') {
  title += '【数列】';
} else if (category === 'ベクトル') {
  title += '【ベクトル】';
} else {
  title += `【${category}】`; // それ以外も柔軟に対応
}

const tex = `\\documentclass[10pt]{ltjarticle}
\\usepackage[a4paper,
          left=15mm,
          right=15mm,
          top=15mm,
          bottom=20mm,   
          footskip=10mm  
         ]{geometry}
\\usepackage{luatexja,amsmath,amssymb,enumitem}
\\renewcommand{\\d}{\\displaystyle}
\\setlist[enumerate]{%
itemsep=1.5\\baselineskip, % 項目と項目の間
topsep=1\\baselineskip,     % リスト直前・直後の余白
}

\\title{${title}}
\\date{\\today}
\\author{阪大数学bot}

\\begin{document}
\\maketitle
学年\\ \\ :\\\\[5pt]

氏名\\ \\ :

\\section*{問題}

次の問いに答えよ.ただし,漸化式が与えられているものについては一般項を$n$を用いて表せ.また解答例に問題番号が書かれている場合はFocusGoldの対応する問題番号の解答を参照せよ.

\\begin{enumerate}[label=\\textbf{\\fbox{\\arabic*}}]
${selected.map(p => `  \\item ${p.latex.trim()}`).join('\n')}
\\end{enumerate}

\\bigskip

\\newpage
\\section*{解答}
オリジナル解答解説は精神誠意作成中です.
\\begin{enumerate}[label=\\textbf{\\fbox{\\arabic*}}]
${selected.map(p => `  \\item ${p.answer || '（解答未登録）'}`).join('\n')}
\\end{enumerate}

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
