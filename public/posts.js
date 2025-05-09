function postsApp() {
    return {
        posts: [],
        categories: [],
        selectedCategory: '',
        showNewPostForm: false,
        showLoginModal: false,
        showRegisterModal: false,
        isAdmin: false,
        currentUser: null,
        notifications: [],
        newPost: {
            title: '',
            content: '',
            category_id: ''
        },
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

            this.loadCategories();
            this.loadPosts();
        },
        async loadCategories() {
            try {
                const response = await fetch('/api/categories');
                if (response.ok) {
                    this.categories = await response.json();
                }
            } catch (error) {
                console.error('Erro ao carregar categorias:', error);
                this.showNotification('Erro ao carregar categorias', 'error');
            }
        },

        async loadPosts() {
            try {
                const url = this.selectedCategory 
                    ? `/api/posts?category_id=${this.selectedCategory}`
                    : '/api/posts';
                const response = await fetch(url);
                if (response.ok) {
                    this.posts = await response.json();
                    // Carregar comentários para cada post
                    for (let post of this.posts) {
                        try {
                            const commentsResponse = await fetch(`/api/posts/${post.id}/comments`);
                            if (commentsResponse.ok) {
                                post.comments = await commentsResponse.json();
                            } else {
                                post.comments = [];
                            }
                        } catch (error) {
                            console.error(`Erro ao carregar comentários do post ${post.id}:`, error);
                            post.comments = [];
                        }
                    }
                }
            } catch (error) {
                console.error('Erro ao carregar posts:', error);
                this.showNotification('Erro ao carregar posts', 'error');
            }
        },

        getCategoryName(categoryId) {
            const category = this.categories.find(c => c.id === categoryId);
            return category ? category.name : 'Sem categoria';
        },

        async createPost() {
            try {
                const response = await fetch('/api/posts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(this.newPost)
                });

                if (response.ok) {
                    this.newPost = { title: '', content: '', category_id: '' };
                    this.showNewPostForm = false;
                    await this.loadPosts();
                    this.showNotification('Post criado com sucesso', 'success');
                } else {
                    this.showNotification('Erro ao criar post', 'error');
                }
            } catch (error) {
                console.error('Erro ao criar post:', error);
                this.showNotification('Erro ao criar post', 'error');
            }
        },

        async deletePost(postId) {
            if (!confirm('Tem certeza que deseja excluir este post?')) return;

            try {
                const response = await fetch(`/api/posts/${postId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.ok) {
                    await this.loadPosts();
                    this.showNotification('Post excluído com sucesso', 'success');
                } else {
                    this.showNotification('Erro ao excluir post', 'error');
                }
            } catch (error) {
                console.error('Erro ao excluir post:', error);
                this.showNotification('Erro ao excluir post', 'error');
            }
        },

        async createComment(postId) {
            if (!this.newComment.trim()) {
                this.showNotification('O comentário não pode estar vazio', 'error');
                return;
            }

            try {
                const response = await fetch(`/api/posts/${postId}/comments`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ content: this.newComment })
                });

                if (response.ok) {
                    this.newComment = '';
                    await this.loadPosts();
                    this.showNotification('Comentário adicionado com sucesso', 'success');
                } else {
                    this.showNotification('Erro ao adicionar comentário', 'error');
                }
            } catch (error) {
                console.error('Erro ao adicionar comentário:', error);
                this.showNotification('Erro ao adicionar comentário', 'error');
            }
        },

        async deleteComment(commentId) {
            if (!confirm('Tem certeza que deseja excluir este comentário?')) return;

            try {
                const response = await fetch(`/api/comments/${commentId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.ok) {
                    await this.loadPosts();
                    this.showNotification('Comentário excluído com sucesso', 'success');
                } else {
                    this.showNotification('Erro ao excluir comentário', 'error');
                }
            } catch (error) {
                console.error('Erro ao excluir comentário:', error);
                this.showNotification('Erro ao excluir comentário', 'error');
            }
        },

        async register() {
            if (this.registerForm.password !== this.registerForm.confirmPassword) {
                this.showNotification('As senhas não coincidem', 'error');
                return;
            }

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: this.registerForm.username,
                        password: this.registerForm.password
                    })
                });

                if (response.ok) {
                    this.showRegisterModal = false;
                    this.registerForm = { username: '', password: '', confirmPassword: '' };
                    this.showNotification('Registro realizado com sucesso. Faça login para continuar.', 'success');
                } else {
                    this.showNotification('Erro ao registrar', 'error');
                }
            } catch (error) {
                console.error('Erro ao registrar:', error);
                this.showNotification('Erro ao registrar', 'error');
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

        showNotification(message, type = 'info') {
            const notification = {
                message,
                type,
                show: true
            };
            this.notifications.push(notification);
            setTimeout(() => this.removeNotification(this.notifications.length - 1), 5000);
        },

        removeNotification(index) {
            this.notifications[index].show = false;
            setTimeout(() => {
                this.notifications.splice(index, 1);
            }, 300);
        }
    };
} 