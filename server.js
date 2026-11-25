const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Секретный пароль администратора (проверяется ТОЛЬКО на сервере)
const ADMIN_TOKEN = 'SECRET_ADMIN_TOKEN_10V';
const DATA_FILE = path.join(__dirname, 'data.json');

// Позволяем серверу принимать JSON данные
app.use(express.json());
// Раздаем статику из папки public
app.use(express.static(path.join(__dirname, 'public')));

// --- API ДЛЯ ПОЛУЧЕНИЯ РАСПИСАНИЯ ---
app.get('/api/schedule', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка чтения файла данных' });
        }
        try {
            res.json(JSON.parse(data));
        } catch (e) {
            res.status(500).json({ error: 'Файл данных поврежден' });
        }
    });
});

// --- API ДЛЯ СОХРАНЕНИЯ РАСПИСАНИЯ (ТОЛЬКО ДЛЯ АДМИНА) ---
app.post('/api/schedule', (req, res) => {
    const token = req.headers.authorization || (req.body && req.body.token);

    if (token !== ADMIN_TOKEN) {
        return res.status(403).json({ error: 'Доступ запрещен' });
    }

    const { startDate, forceMode, scheduleData } = req.body || {};

    if (!scheduleData || typeof scheduleData !== 'object') {
        return res.status(400).json({ error: 'Некорректные данные расписания' });
    }

    const cleanData = {
        startDate: startDate || '2026-09-01',
        forceMode: ['auto', 'online', 'offline'].includes(forceMode) ? forceMode : 'auto',
        scheduleData
    };

    fs.writeFile(DATA_FILE, JSON.stringify(cleanData, null, 2) + '\n', 'utf8', (err) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка сохранения файла' });
        }
        res.json({ success: true, message: 'Данные сохранены!' });
    });
});

app.listen(PORT, () => {
    console.log(`✅ Сервер запущен! Открой в браузере: http://localhost:${PORT}`);
});
