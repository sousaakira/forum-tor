function postApp() {
    return {
        post: null,
        comments: [],
        currentUser: null,
        showLoginModal: false,
        newComment: '',
        loginForm: {
            username: '',
            password: ''
        },
        registerForm: {
            username: '',
            password: '',
            confirmPassword: ''
        },

        init() {
            this.loadPost();
        },

        async checkAuth() {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await fetch('/api/auth/me', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (response.ok) {
                        const user = await response.json();
                        this.currentUser = user;
                        this.isLoggedIn = true;
                    } else {
                        this.logout();
                    }
                } catch (error) {
                    console.error('Erro ao verificar autenticação:', error);
                    this.logout();
                }
            }
        },

        async loadPost() {
            const urlParams = new URLSearchParams(window.location.search);
            const postId = urlParams.get('id');
            
            if (!postId) {
                window.location.href = '/posts.html';
                return;
            }

            try {
                const response = await fetch(`/api/posts/${postId}`);
                if (response.ok) {
                    this.post = await response.json();
                    this.loadComments();
                } else {
                    window.location.href = '/posts.html';
                }
            } catch (error) {
                console.error('Erro ao carregar post:', error);
            }
        },

        async loadComments() {
            if (!this.post) return;

            try {
                const response = await fetch(`/api/posts/${this.post.id}/comments`);
                if (response.ok) {
                    this.comments = await response.json();
                }
            } catch (error) {
                console.error('Erro ao carregar comentários:', error);
            }
        },

        async createComment() {
            if (!this.isLoggedIn) {
                this.showLoginModal = true;
                return;
            }

            if (!this.newComment.trim()) return;

            const token = localStorage.getItem('token');
            try {
                const response = await fetch(`/api/posts/${this.post.id}/comments`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        content: this.newComment
                    })
                });

                if (response.ok) {
                    const comment = await response.json();
                    this.comments.push(comment);
                    this.newComment = '';
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
            return new Intl.DateTimeFormat('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
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
        }
    };
} 