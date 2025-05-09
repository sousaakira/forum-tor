const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('forum.db');

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'seu_segredo_jwt', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

// Rotas de autenticação
router.post('/auth/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashedPassword],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'Nome de usuário já existe' });
                    }
                    return res.status(500).json({ error: 'Erro ao criar usuário' });
                }

                const token = jwt.sign(
                    { id: this.lastID, username },
                    process.env.JWT_SECRET || 'seu_segredo_jwt',
                    { expiresIn: '24h' }
                );

                res.status(201).json({
                    token,
                    user: {
                        id: this.lastID,
                        username
                    }
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
});

router.get('/auth/verify', authenticateToken, (req, res) => {
    res.json({ valid: true, user: req.user });
});


// Rota para buscar posts recentes
router.get('/posts/recent', (req, res) => {
    const query = `
        SELECT p.*, u.username, c.name as category_name
        FROM posts p
        JOIN users u ON p.user_id = u.id
        JOIN categories c ON p.category_id = c.id
        ORDER BY p.created_at DESC
        LIMIT 5
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar posts recentes:', err);
            return res.status(500).json({ error: 'Erro ao buscar posts recentes' });
        }
        res.json(rows);
    });
});

// Rotas de comentários
router.get('/posts/:postId/comments', (req, res) => {
    const { postId } = req.params;

    db.all(`
        SELECT c.*, u.username 
        FROM comments c 
        JOIN users u ON c.user_id = u.id 
        WHERE c.post_id = ? 
        ORDER BY c.created_at ASC
    `, [postId], (err, comments) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar comentários' });
        }
        res.json(comments);
    });
});

router.post('/posts/:postId/comments', authenticateToken, (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    db.run(
        'INSERT INTO comments (content, post_id, user_id) VALUES (?, ?, ?)',
        [content, postId, userId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao criar comentário' });
            }

            db.get(`
                SELECT c.*, u.username 
                FROM comments c 
                JOIN users u ON c.user_id = u.id 
                WHERE c.id = ?
            `, [this.lastID], (err, comment) => {
                if (err) {
                    return res.status(500).json({ error: 'Erro ao buscar comentário criado' });
                }
                res.status(201).json(comment);
            });
        }
    );
});

module.exports = router; 