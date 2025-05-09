function forumApp() {
    return {
        posts: [],
        categories: [],
        isLoggedIn: false,
        currentUser: null,
        showLoginModal: false,
        showNewPostForm: false,
        selectedCategory: null,
        // Variáveis de paginação
        currentPage: 1,
        postsPerPage: 10,
        totalPosts: 0,
        totalPages: 1,
        loginForm: {
            username: '',
            password: ''
        },
        registerForm: {
            username: '',
            password: '',
            confirmPassword: ''
        },
        newPost: {
            title: '',
            content: '',
            category_id: ''
        },

        init() {
            this.loadCategories();
            
            // Verifica se há uma categoria selecionada na URL
            const urlParams = new URLSearchParams(window.location.search);
            const categoryId = urlParams.get('category');
            console.log('Categoria da URL:', categoryId);
            
            if (categoryId) {
                this.selectedCategory = parseInt(categoryId);
                console.log('Carregando posts da categoria:', this.selectedCategory);
                this.loadPostsByCategory(this.selectedCategory);
            } else {
                console.log('Carregando todos os posts');
                this.loadPosts();
            }
        },

        async loadPosts() {
            try {
                console.log('Carregando posts...');
                const response = await fetch(`/api/posts?page=${this.currentPage}&limit=${this.postsPerPage}`);
                const data = await response.json();
                console.log('Dados recebidos:', data);
                
                if (Array.isArray(data)) {
                    this.posts = data;
                } else if (data.posts && Array.isArray(data.posts)) {
                    this.posts = data.posts;
                    this.totalPosts = data.total || data.posts.length;
                    this.totalPages = Math.ceil(this.totalPosts / this.postsPerPage);
                } else {
                    console.error('Formato de dados inválido:', data);
                    this.posts = [];
                }
                
                console.log('Posts atualizados:', this.posts);
            } catch (error) {
                console.error('Erro ao carregar posts:', error);
                this.posts = [];
            }
        },

        async loadPostsByCategory(categoryId) {
            try {
                console.log('Carregando posts da categoria:', categoryId);
                const response = await fetch(`/api/posts?category_id=${categoryId}&page=${this.currentPage}&limit=${this.postsPerPage}`);
                const data = await response.json();
                console.log('Dados recebidos da categoria:', data);
                
                if (Array.isArray(data)) {
                    this.posts = data;
                } else if (data.posts && Array.isArray(data.posts)) {
                    this.posts = data.posts;
                    this.totalPosts = data.total || data.posts.length;
                    this.totalPages = Math.ceil(this.totalPosts / this.postsPerPage);
                } else {
                    console.error('Formato de dados inválido:', data);
                    this.posts = [];
                }
                
                console.log('Posts da categoria atualizados:', this.posts);
            } catch (error) {
                console.error('Erro ao carregar posts da categoria:', error);
                this.posts = [];
            }
        },

        filterByCategory(categoryId) {
            this.selectedCategory = categoryId ? parseInt(categoryId) : null;
            console.log('Categoria selecionada:', this.selectedCategory);
            
            // Atualiza a URL com a categoria selecionada
            const url = new URL(window.location.href);
            if (categoryId) {
                url.searchParams.set('category', categoryId);
            } else {
                url.searchParams.delete('category');
            }
            window.history.pushState({}, '', url);

            if (this.selectedCategory) {
                this.loadPostsByCategory(this.selectedCategory);
            } else {
                this.loadPosts();
            }
        },

        async toggleComments(postId) {
            const post = this.posts.find(p => p.id === postId);
            if (!post) return;

            post.showComments = !post.showComments;
            
            if (post.showComments && (!post.comments || post.comments.length === 0)) {
                await this.loadComments(postId);
            }
        },

        async loadComments(postId) {
            try {
                const response = await fetch(`/api/posts/${postId}/comments`);
                const comments = await response.json();
                const post = this.posts.find(p => p.id === postId);
                if (post) {
                    post.comments = comments;
                }
            } catch (error) {
                console.error('Erro ao carregar comentários:', error);
            }
        },

        async createComment(postId) {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Você precisa estar logado para comentar');
                return;
            }

            const post = this.posts.find(p => p.id === postId);
            if (!post || !post.newComment.trim()) return;

            try {
                const response = await fetch(`/api/posts/${postId}/comments`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        content: post.newComment
                    })
                });

                if (response.ok) {
                    const newComment = await response.json();
                    post.comments = [...post.comments, newComment];
                    post.newComment = '';
                } else {
                    const error = await response.json();
                    alert(error.error || 'Erro ao criar comentário');
                }
            } catch (error) {
                console.error('Erro ao criar comentário:', error);
                alert('Erro ao criar comentário');
            }
        },

        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        },

        formatContent(content) {
            if (!content) return '';
            // Escapa caracteres HTML para evitar XSS
            const escaped = content
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
            // Substitui quebras de linha por <br>
            return escaped.replace(/\n/g, '<br>');
        },

        createPost() {
            console.log('Iniciando criação de post...');
            
            if (!this.isLoggedIn) {
                console.log('Usuário não está logado');
                alert('Você precisa estar logado para criar um post');
                return;
            }

            if (!this.newPost.title || !this.newPost.content || !this.newPost.category_id) {
                console.log('Dados do post incompletos:', this.newPost);
                alert('Por favor, preencha todos os campos');
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                console.log('Token não encontrado');
                alert('Erro de autenticação. Por favor, faça login novamente.');
                return;
            }

            console.log('Dados do post a serem enviados:', {
                title: this.newPost.title,
                content: this.newPost.content,
                category_id: parseInt(this.newPost.category_id)
            });

            fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: this.newPost.title,
                    content: this.newPost.content,
                    category_id: parseInt(this.newPost.category_id)
                })
            })
            .then(response => {
                console.log('Resposta do servidor recebida:', response.status);
                return response.json().then(data => {
                    if (!response.ok) {
                        throw new Error(data.error || 'Erro ao criar post');
                    }
                    return data;
                });
            })
            .then(post => {
                console.log('Post criado com sucesso:', post);
                this.posts.unshift(post);
                this.newPost = {
                    title: '',
                    content: '',
                    category_id: ''
                };
                this.showNewPostForm = false;
                console.log('Lista de posts atualizada:', this.posts);
            })
            .catch(error => {
                console.error('Erro ao criar post:', error);
                alert(error.message || 'Erro ao criar post. Por favor, tente novamente.');
            });
        },

        showComments(postId) {
            // Implementar lógica para mostrar comentários
            console.log('Mostrar comentários do post:', postId);
        },

        async loadCategories() {
            try {
                const response = await fetch('/api/categories');
                if (response.ok) {
                    this.categories = await response.json();
                }
            } catch (error) {
                console.error('Erro ao carregar categorias:', error);
            }
        },

        // Funções de paginação
        nextPage() {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
                if (this.selectedCategory) {
                    this.loadPostsByCategory(this.selectedCategory);
                } else {
                    this.loadPosts();
                }
            }
        },

        previousPage() {
            if (this.currentPage > 1) {
                this.currentPage--;
                if (this.selectedCategory) {
                    this.loadPostsByCategory(this.selectedCategory);
                } else {
                    this.loadPosts();
                }
            }
        }
    };
} 