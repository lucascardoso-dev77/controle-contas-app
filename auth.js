document.addEventListener('DOMContentLoaded', () => {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authMessage = document.getElementById('auth-message');

    // Campos de Login
    const loginUsernameInput = document.getElementById('login-username');
    const loginPasswordInput = document.getElementById('login-password');

    // Campos de Cadastro
    const registerUsernameInput = document.getElementById('register-username');
    const registerPasswordInput = document.getElementById('register-password');

    // Função para exibir mensagens
    function showMessage(message, type = 'info') {
        authMessage.textContent = message;
        authMessage.style.color = type === 'error' ? 'var(--danger-color)' : 'var(--primary-color)';
    }

    // Alternar entre as abas de Login e Cadastro
    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        authMessage.textContent = ''; // Limpa mensagens
    });

    registerTab.addEventListener('click', () => {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        authMessage.textContent = ''; // Limpa mensagens
    });

    // Lógica de Login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = loginUsernameInput.value.trim();
        const password = loginPasswordInput.value.trim();

        if (!username || !password) {
            showMessage('Por favor, preencha todos os campos.', 'error');
            return;
        }

        // Recupera usuários do localStorage
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            // Autenticação bem-sucedida
            localStorage.setItem('currentUser', JSON.stringify({ username: user.username }));
            showMessage('Login realizado com sucesso! Redirecionando...');
            setTimeout(() => {
                window.location.href = 'dashboard.html'; // Redireciona para o dashboard
            }, 1000);
        } else {
            showMessage('Usuário ou senha inválidos.', 'error');
        }
    });

    // Lógica de Cadastro
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = registerUsernameInput.value.trim();
        const password = registerPasswordInput.value.trim();

        if (!username || !password) {
            showMessage('Por favor, preencha todos os campos.', 'error');
            return;
        }

        // Recupera usuários do localStorage
        const users = JSON.parse(localStorage.getItem('users')) || [];

        // Verifica se o usuário já existe
        if (users.some(u => u.username === username)) {
            showMessage('Nome de usuário já existe. Escolha outro.', 'error');
            return;
        }

        // Adiciona novo usuário
        users.push({ username, password });
        localStorage.setItem('users', JSON.stringify(users));

        showMessage('Cadastro realizado com sucesso! Faça login.', 'info');
        registerForm.reset();
        // Volta para a aba de login
        loginTab.click();
    });
});