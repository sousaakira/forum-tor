function homeApp() {
    return {
        isLoggedIn: false,
        showLoginModal: false,
        showRegisterModal: false,
        recentPosts: [],
        loginForm: {
            username: '',
            password: ''
        },
        registerForm: {
            username: '',
            password: '',
            confirmPassword: ''
        },

        async init() {
            await this.loadRecentPosts();
        },

        async loadRecentPosts() {
            try {
                const response = await fetch('/api/posts/recent');
                const data = await response.json();
                console.log('Posts recentes recebidos:', data);
                this.recentPosts = data;
            } catch (error) {
                console.error('Erro ao carregar posts recentes:', error);
            }
        },

        formatDate(dateString) {
            if (!dateString) return 'Data não disponível';
            
            try {
                const date = new Date(dateString);
                if (isNaN(date.getTime())) return 'Data inválida';
                
                return date.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (error) {
                console.error('Erro ao formatar data:', error);
                return 'Data inválida';
            }
        },
    };
} 