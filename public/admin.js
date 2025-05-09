function adminApp() {
    return {
        users: [],
        categories: [],
        newCategory: '',
        isLoggedIn: false,
        isAdmin: false,
        currentUser: null,

        init() {
            this.checkAuth();
            this.loadUsers();
            this.loadCategories();
        },

        async checkAuth() {
            const token = localStorage.getItem('token');
            if (!token) {
                this.isLoggedIn = false;
                this.isAdmin = false;
                return;
            }

            try {
                const response = await fetch('/api/auth/is-admin', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    this.isLoggedIn = true;
                    this.isAdmin = data.is_admin;
                    this.currentUser = data.user;
                } else {
                    this.isLoggedIn = false;
                    this.isAdmin = false;
                    localStorage.removeItem('token');
                }
            } catch (error) {
                console.error('Erro ao verificar autenticação:', error);
                this.isLoggedIn = false;
                this.isAdmin = false;
            }
        },

        async loadUsers() {
            try {
                const response = await fetch('/api/admin/users', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.ok) {
                    this.users = await response.json();
                } else {
                    alert('Erro ao carregar usuários');
                }
            } catch (error) {
                console.error('Erro ao carregar usuários:', error);
                alert('Erro ao carregar usuários');
            }
        },

        async loadCategories() {
            try {
                const response = await fetch('/api/categories');
                if (response.ok) {
                    this.categories = await response.json();
                } else {
                    alert('Erro ao carregar categorias');
                }
            } catch (error) {
                console.error('Erro ao carregar categorias:', error);
                alert('Erro ao carregar categorias');
            }
        },

        async toggleAdmin(userId) {
            if (!confirm('Deseja alterar o status de administrador deste usuário?')) {
                return;
            }

            try {
                const response = await fetch(`/api/admin/users/${userId}/toggle-admin`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.ok) {
                    await this.loadUsers();
                    alert('Status de administrador atualizado com sucesso');
                } else {
                    alert('Erro ao atualizar status de administrador');
                }
            } catch (error) {
                console.error('Erro ao atualizar status de administrador:', error);
                alert('Erro ao atualizar status de administrador');
            }
        },

        async deleteUser(userId) {
            if (!confirm('Tem certeza que deseja excluir este usuário?')) {
                return;
            }

            try {
                const response = await fetch(`/api/admin/users/${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.ok) {
                    await this.loadUsers();
                    alert('Usuário excluído com sucesso');
                } else {
                    alert('Erro ao excluir usuário');
                }
            } catch (error) {
                console.error('Erro ao excluir usuário:', error);
                alert('Erro ao excluir usuário');
            }
        },

        async createCategory() {
            if (!this.newCategory.trim()) {
                return;
            }

            try {
                const response = await fetch('/api/categories', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ name: this.newCategory })
                });

                if (response.ok) {
                    this.newCategory = '';
                    await this.loadCategories();
                    alert('Categoria criada com sucesso');
                } else {
                    alert('Erro ao criar categoria');
                }
            } catch (error) {
                console.error('Erro ao criar categoria:', error);
                alert('Erro ao criar categoria');
            }
        },

        async deleteCategory(categoryId) {
            if (!confirm('Tem certeza que deseja excluir esta categoria?')) {
                return;
            }

            try {
                const response = await fetch(`/api/categories/${categoryId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.ok) {
                    await this.loadCategories();
                    alert('Categoria excluída com sucesso');
                } else {
                    alert('Erro ao excluir categoria');
                }
            } catch (error) {
                console.error('Erro ao excluir categoria:', error);
                alert('Erro ao excluir categoria');
            }
        },

        logout() {
            localStorage.removeItem('token');
            this.isLoggedIn = false;
            this.isAdmin = false;
            this.currentUser = null;
            window.location.href = 'home.html';
        },

        formatDate(dateString) {
            return new Date(dateString).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    };
} 