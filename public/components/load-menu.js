// Inicializa o store global de autenticação
Alpine.store('auth', {
    isLoggedIn: false,
    currentUser: null
});

async function loadMenu() {
    try {
        // Carrega o template do menu
        const menuResponse = await fetch('/components/menu.html');
        const menuHtml = await menuResponse.text();

        // Adiciona o menu ao container primeiro
        const menuContainer = document.getElementById('menu-container');
        if (menuContainer) {
            menuContainer.innerHTML = menuHtml;
            
            // Define a função menuComponent
            function menuComponent() {
                return {
                    isLoggedIn: false,
                    currentUser: null,
                    showLoginModal: false,
                    showRegisterModal: false,
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
                        this.checkAuth();
                    },

                    async checkAuth() {
                        const token = localStorage.getItem('token');
                        console.log('token', token);
                        if (token) {
                            try {
                                const response = await fetch('/api/auth/me', {
                                    headers: {
                                        'Authorization': 'Bearer ' + token
                                    }
                                });
                                console.log('response', response);
                                if (response.ok) {
                                    const user = await response.json();
                                    this.currentUser = user;
                                    this.isLoggedIn = true;
                                    // Atualiza o store global
                                    Alpine.store('auth').isLoggedIn = true;
                                    Alpine.store('auth').currentUser = user;
                                    console.log('user', this.isLoggedIn);
                                } else {
                                    this.logout();
                                }
                            } catch (error) {
                                console.error('Erro ao verificar autenticação:', error);
                                alert('Erro ao verificar autenticação');
                                this.logout();
                            }
                        }
                    },

                    async login() {
                        try {
                            const response = await fetch('/api/auth/login', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(this.loginForm)
                            });

                            if (response.ok) {
                                const data = await response.json();
                                localStorage.setItem('token', data.token);
                                this.currentUser = data.user;
                                this.isLoggedIn = true;
                                // Atualiza o store global
                                Alpine.store('auth').isLoggedIn = true;
                                Alpine.store('auth').currentUser = data.user;
                                this.showLoginModal = false;
                                this.loginForm = { username: '', password: '' };
                                window.location.reload();
                            } else {
                                const error = await response.json();
                                alert(error.message || 'Erro ao fazer login');
                            }
                        } catch (error) {
                            console.error('Erro ao fazer login:', error);
                            alert('Erro ao fazer login');
                        }
                    },

                    async register() {
                        if (this.registerForm.password !== this.registerForm.confirmPassword) {
                            alert('As senhas não coincidem');
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
                                const data = await response.json();
                                localStorage.setItem('token', data.token);
                                this.currentUser = data.user;
                                this.isLoggedIn = true;
                                // Atualiza o store global
                                Alpine.store('auth').isLoggedIn = true;
                                Alpine.store('auth').currentUser = data.user;
                                this.showRegisterModal = false;
                                this.registerForm = { username: '', password: '', confirmPassword: '' };
                                window.location.reload();
                            } else {
                                const error = await response.json();
                                alert(error.message || 'Erro ao cadastrar');
                            }
                        } catch (error) {
                            console.error('Erro ao cadastrar:', error);
                            alert('Erro ao cadastrar');
                        }
                    },

                    logout() {
                        localStorage.removeItem('token');
                        this.isLoggedIn = false;
                        this.currentUser = null;
                        // Atualiza o store global
                        Alpine.store('auth').isLoggedIn = false;
                        Alpine.store('auth').currentUser = null;
                        window.location.reload();
                    }
                };
            }

            // Registra o componente no Alpine.js
            Alpine.data('menu', menuComponent);
        }
    } catch (error) {
        console.error('Erro ao carregar o menu:', error);
    }
}

// Carrega o menu quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', loadMenu); 