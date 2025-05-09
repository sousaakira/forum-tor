function forumApp() {
    return {
        posts: [],
        categories: [],
        selectedCategory: null,
        showNewPostForm: false,
        currentPage: 1,
        totalPages: 1,
        postsPerPage: 10,
        newPost: {
            title: '',
            content: '',
            category_id: ''
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
            }
        },

        async loadPosts() {
            try {
                const url = this.selectedCategory 
                    ? `/api/posts?category_id=${this.selectedCategory}&page=${this.currentPage}&per_page=${this.postsPerPage}`
                    : `/api/posts?page=${this.currentPage}&per_page=${this.postsPerPage}`;
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    this.posts = data.posts;
                    this.totalPages = data.totalPages;
                }
            } catch (error) {
                console.error('Erro ao carregar posts:', error);
            }
        },

        previousPage() {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadPosts();
            }
        },

        nextPage() {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
                this.loadPosts();
            }
        },

        filterByCategory(categoryId) {
            this.selectedCategory = categoryId;
            this.currentPage = 1; // Reset para primeira página ao filtrar
            this.loadPosts();
        },

        async createPost() {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    alert('Você precisa estar logado para criar um post');
                    return;
                }

                const response = await fetch('/api/posts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(this.newPost)
                });

                if (response.ok) {
                    this.newPost = {
                        title: '',
                        content: '',
                        category_id: ''
                    };
                    this.showNewPostForm = false;
                    this.loadPosts();
                } else {
                    const error = await response.json();
                    alert(error.message || 'Erro ao criar post');
                }
            } catch (error) {
                console.error('Erro ao criar post:', error);
                alert('Erro ao criar post');
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
        }
    };
}

// Registra o componente no Alpine.js
Alpine.data('forumApp', forumApp); 