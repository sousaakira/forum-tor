# Fórum Tor

Um fórum anônimo e seguro na rede Tor, desenvolvido com Node.js e Alpine.js.

## Características

- 🔒 Comunicação segura e anônima através da rede Tor
- 👥 Sistema de usuários com autenticação
- 📝 Posts organizados por categorias
- 💬 Sistema de comentários
- 🎨 Interface moderna e responsiva
- 🌙 Suporte a modo escuro
- 📱 Design responsivo para dispositivos móveis

## Tecnologias Utilizadas

- **Backend:**
  - Node.js
  - Express.js
  - SQLite3
  - JWT para autenticação
  - Bcrypt para hash de senhas

- **Frontend:**
  - Alpine.js
  - Tailwind CSS
  - HTML5
  - CSS3

## Requisitos

- Node.js 14.x ou superior
- NPM 6.x ou superior
- Navegador moderno com suporte a JavaScript ES6+

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/forum-tor.git
cd forum-tor
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor:
```bash
npm start
```

Para desenvolvimento, use:
```bash
npm run dev
```

O servidor estará disponível em `http://localhost:3000`.

## Estrutura do Projeto

```
forum-tor/
├── public/
│   ├── home.html
│   ├── posts.html
│   ├── about.html
│   ├── home.js
│   ├── posts.js
│   ├── about.js
│   └── styles.css
├── server.js
├── package.json
└── README.md
```

## API Endpoints

### Autenticação

- `POST /api/auth/register` - Registro de novo usuário
- `POST /api/auth/login` - Login de usuário
- `GET /api/auth/me` - Obter informações do usuário atual

### Categorias

- `GET /api/categories` - Listar todas as categorias
- `POST /api/categories` - Criar nova categoria (requer autenticação)

### Posts

- `GET /api/posts` - Listar todos os posts
- `POST /api/posts` - Criar novo post (requer autenticação)

### Comentários

- `GET /api/posts/:postId/comments` - Listar comentários de um post
- `POST /api/posts/:postId/comments` - Adicionar comentário (requer autenticação)

## Segurança

- Todas as senhas são hasheadas usando bcrypt
- Autenticação via JWT
- Proteção contra SQL Injection
- Validação de dados
- Sanitização de inputs

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## Contato

Para sugestões, abra um issue