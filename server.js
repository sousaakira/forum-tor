const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const apiRoutes = require('./routes/api');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'tor_forum_secret_key_2024';

// Middleware
app.use(cors());
app.use(express.json());

// Configuração de cache para arquivos estáticos
const staticOptions = {
  maxAge: '1d', // Cache por 1 dia
  etag: true,
  lastModified: true
};

// Servir arquivos estáticos com cache
app.use(express.static('public', staticOptions));

// Montar rotas da API
app.use('/api', apiRoutes);

// Conexão com o banco de dados
const db = new sqlite3.Database('forum.db', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
  } else {
    console.log('Conectado ao banco de dados SQLite');
    
    // Criar tabelas
    db.serialize(() => {
      // Tabela de usuários
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        is_admin BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Tabela de categorias
      db.run(`CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Tabela de posts
      db.run(`CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (category_id) REFERENCES categories (id)
      )`);

      // Tabela de comentários
      db.run(`CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (post_id) REFERENCES posts (id)
      )`);
    });
  }
});

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
};

// Middleware para verificar se o usuário é admin
const isAdmin = (req, res, next) => {
    console.log('Verificando admin...');
    const token = req.headers.authorization?.split(' ')[1];
    console.log('Token:', token);
    if (!token) {
        console.log('Token não fornecido');
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Decoded:', decoded);
        if (!decoded.is_admin) {
            console.log('Acesso negado');
            return res.status(403).json({ error: 'Acesso negado' });
        }
        req.user = decoded;
        next();
    } catch (error) {
        console.log('Erro ao verificar admin:', error);
        res.status(401).json({ error: 'Token inválido' });
    }
};

// Rota de login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username e senha são obrigatórios' });
    }

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar usuário' });
        }

        if (!user) {
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Senha incorreta' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, is_admin: user.is_admin },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                is_admin: user.is_admin
            }
        });
    });
});

// Rota de registro
app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username e senha são obrigatórios' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
    }

    // Verifica se é o primeiro usuário
    db.get('SELECT COUNT(*) as count FROM users', [], async (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao verificar usuários' });
        }

        const isFirstUser = row.count === 0;
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
            'INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)',
            [username, hashedPassword, isFirstUser],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'Username já existe' });
                    }
                    return res.status(500).json({ error: 'Erro ao criar usuário' });
                }

                const token = jwt.sign(
                    { id: this.lastID, username, is_admin: isFirstUser },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                res.json({ token, user: { id: this.lastID, username, is_admin: isFirstUser } });
            }
        );
    });
});


app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ id: req.user.id, username: req.user.username });
});

// Rota para verificar se o usuário é admin
app.get('/api/auth/is-admin', authenticateToken, (req, res) => {
    db.get('SELECT is_admin FROM users WHERE id = ?', [req.user.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao verificar status de admin' });
        }
        res.json({ is_admin: row.is_admin, user: { id: req.user.id, username: req.user.username } });
    });
});

// Rotas de categorias
app.get('/api/categories', (req, res) => {
    db.all(`
        SELECT c.*, 
               COUNT(DISTINCT p.id) as postCount,
               COUNT(DISTINCT p.user_id) as member_count
        FROM categories c 
        LEFT JOIN posts p ON c.id = p.category_id 
        GROUP BY c.id
    `, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar categorias' });
        }
        res.json(rows);
    });
});

app.post('/api/categories', isAdmin, (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
    }

    db.run('INSERT INTO categories (name) VALUES (?)', [name], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Erro ao criar categoria' });
        }
        res.json({ id: this.lastID, name });
    });
});

app.delete('/api/categories/:id', isAdmin, (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM categories WHERE id = ?', [id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Erro ao excluir categoria' });
        }
        res.json({ success: true });
    });
});

// Rotas de posts
app.get('/api/posts', (req, res) => {
    const { category_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
        SELECT p.*, u.username, c.name as category_name,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        JOIN categories c ON p.category_id = c.id
    `;

    let countQuery = `
        SELECT COUNT(*) as total
        FROM posts p
        JOIN users u ON p.user_id = u.id
        JOIN categories c ON p.category_id = c.id
    `;

    const params = [];
    if (category_id) {
        query += ' WHERE p.category_id = ?';
        countQuery += ' WHERE p.category_id = ?';
        params.push(parseInt(category_id));
    }

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    // Primeiro, obtém o total de posts
    db.get(countQuery, category_id ? [parseInt(category_id)] : [], (err, countResult) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao contar posts' });
        }

        // Depois, obtém os posts paginados
        db.all(query, params, (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao buscar posts' });
            }
            res.json({
                posts: rows,
                total: countResult.total,
                currentPage: parseInt(page),
                totalPages: Math.ceil(countResult.total / limit)
            });
        });
    });
});

app.post('/api/posts', authenticateToken, (req, res) => {
    const { title, content, category_id } = req.body;

    if (!title || !content || !category_id) {
        console.log('Erro: campos obrigatórios faltando', { title, content, category_id });
        return res.status(400).json({ error: 'Título, conteúdo e categoria são obrigatórios' });
    }

    // Primeiro, verifica se a categoria existe
    db.get('SELECT name FROM categories WHERE id = ?', [category_id], (err, category) => {
        if (err) {
            console.error('Erro ao verificar categoria:', err);
            return res.status(500).json({ error: 'Erro ao verificar categoria' });
        }
        if (!category) {
            console.log('Categoria não encontrada:', category_id);
            return res.status(400).json({ error: 'Categoria não encontrada' });
        }

        console.log('Categoria encontrada:', category);

        // Se a categoria existe, cria o post
        db.run(
            'INSERT INTO posts (title, content, user_id, category_id) VALUES (?, ?, ?, ?)',
            [title, content, req.user.id, category_id],
            function(err) {
                if (err) {
                    console.error('Erro ao criar post:', err);
                    return res.status(500).json({ error: 'Erro ao criar post' });
                }

                console.log('Post criado com sucesso, ID:', this.lastID);

                // Busca o post criado com todas as informações necessárias
                db.get(`
                    SELECT p.*, u.username, c.name as category_name,
                    (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
                    FROM posts p
                    JOIN users u ON p.user_id = u.id
                    JOIN categories c ON p.category_id = c.id
                    WHERE p.id = ?
                `, [this.lastID], (err, post) => {
                    if (err) {
                        console.error('Erro ao buscar post criado:', err);
                        return res.status(500).json({ error: 'Erro ao buscar post criado' });
                    }
                    console.log('Post recuperado com sucesso:', post);
                    res.json({
                        ...post,
                        showComments: false,
                        comments: [],
                        newComment: ''
                    });
                });
            }
        );
    });
});

app.get('/api/posts/:id', (req, res) => {
    const { id } = req.params;
    db.get(`
        SELECT p.*, u.username, c.name as category_name
        FROM posts p
        JOIN users u ON p.user_id = u.id
        JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
    `, [id], (err, post) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar post' });
        }
        if (!post) {
            return res.status(404).json({ error: 'Post não encontrado' });
        }
        res.json(post);
    });
});

app.delete('/api/posts/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    db.get('SELECT user_id FROM posts WHERE id = ?', [id], (err, post) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar post' });
        }
        if (!post) {
            return res.status(404).json({ error: 'Post não encontrado' });
        }
        if (post.user_id !== req.user.id && !req.user.is_admin) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        db.run('DELETE FROM posts WHERE id = ?', [id], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao excluir post' });
            }
            res.json({ success: true });
        });
    });
});

// Rotas de comentários
app.get('/api/posts/:postId/comments', (req, res) => {
    const { postId } = req.params;
    db.all(`
        SELECT c.*, u.username
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ?
        ORDER BY c.created_at ASC
    `, [postId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar comentários' });
        }
        res.json(rows);
    });
});

app.post('/api/posts/:postId/comments', authenticateToken, (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ error: 'Conteúdo é obrigatório' });
    }

    db.run(
        'INSERT INTO comments (content, user_id, post_id) VALUES (?, ?, ?)',
        [content, req.user.id, postId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao criar comentário' });
            }
            res.json({
                id: this.lastID,
                content,
                user_id: req.user.id,
                post_id: postId,
                created_at: new Date().toISOString()
            });
        }
    );
});

app.delete('/api/comments/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    db.get('SELECT user_id FROM comments WHERE id = ?', [id], (err, comment) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar comentário' });
        }
        if (!comment) {
            return res.status(404).json({ error: 'Comentário não encontrado' });
        }
        if (comment.user_id !== req.user.id && !req.user.is_admin) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        db.run('DELETE FROM comments WHERE id = ?', [id], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao excluir comentário' });
            }
            res.json({ success: true });
        });
    });
});

// Rotas de administração
app.get('/api/admin/users', isAdmin, (req, res) => {
    console.log('Buscando usuários...');
    db.all('SELECT id, username, created_at, is_admin FROM users', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar usuários' });
        }
        res.json(rows);
    });
});

app.post('/api/admin/users/:userId/toggle-admin', isAdmin, (req, res) => {
    const { userId } = req.params;
    db.run('UPDATE users SET is_admin = NOT is_admin WHERE id = ?', [userId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Erro ao atualizar status de admin' });
        }
        res.json({ success: true });
    });
});

app.delete('/api/admin/users/:userId', isAdmin, (req, res) => {
    const { userId } = req.params;
    db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Erro ao excluir usuário' });
        }
        res.json({ success: true });
    });
});

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicialização do servidor
app.listen(port, () => {
    console.log(`Servidor rodando na porta http://127.0.0.1:${port}`);
}); 