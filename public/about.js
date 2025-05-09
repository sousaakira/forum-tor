function aboutApp() {
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
    };
} 