const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const DATA_FILE = path.join(__dirname, 'players.json');

app.use(cors());
app.use(express.json());
app.use('/thunder-warrior', express.static(__dirname));
app.use(express.static(__dirname));

function readPlayers() {
    try {
        if (!fs.existsSync(DATA_FILE)) return [];
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
        return [];
    }
}

function writePlayers(players) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(players, null, 2));
}

// 获取所有玩家记录
app.get('/api/players', (req, res) => {
    const players = readPlayers();
    players.sort((a, b) => b.bestScore - a.bestScore);
    res.json(players);
});

// 提交/更新玩家记录
app.post('/api/players', (req, res) => {
    const { name, score } = req.body;
    if (!name || score === undefined) return res.status(400).json({ error: '缺少参数' });

    const players = readPlayers();
    const existing = players.find(p => p.name === name);
    if (existing) {
        if (score > existing.bestScore) existing.bestScore = score;
        existing.playCount = (existing.playCount || 1) + 1;
        existing.lastPlayed = Date.now();
    } else {
        players.push({ name, bestScore: score, playCount: 1, lastPlayed: Date.now() });
    }

    writePlayers(players);
    players.sort((a, b) => b.bestScore - a.bestScore);
    res.json(players);
});

// 密码验证（密码只存服务端，不暴露给前端）
app.post('/api/auth', (req, res) => {
    const { password } = req.body;
    if (!password) return res.status(400).json({ ok: false, msg: '请输入密码' });
    const correct = process.env.GAME_PASSWORD || '8888';
    if (password === correct) {
        res.json({ ok: true });
    } else {
        res.json({ ok: false, msg: '密码错误' });
    }
});

app.listen(PORT, () => {
    console.log(`雷电战机服务器运行中: http://localhost:${PORT}`);
});
