/* Authentication Handlers (User Login & Registration) */

document.addEventListener('DOMContentLoaded', () => {
    // 1. User Registration Form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('reg-name').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const phone = document.getElementById('reg-phone').value.trim();
            const role = document.getElementById('reg-role')?.value || 'user';
            const password = document.getElementById('reg-password').value;

            const submitBtn = registerForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating Account...';

            try {
                const res = await apiRequest('/auth/register', 'POST', {
                    name,
                    email,
                    phone,
                    role,
                    password
                });

                if (res.success) {
                    setAuth(res.token, res.user);
                    showToast(`Account created as ${res.user.role.toUpperCase()}! Redirecting...`, 'success');
                    setTimeout(() => {
                        if (res.user.role === 'admin') {
                            window.location.href = '/admin/users.html';
                        } else if (res.user.role === 'organiser') {
                            window.location.href = '/admin/dashboard.html';
                        } else {
                            window.location.href = '/events.html';
                        }
                    }, 1000);
                }
            } catch (err) {
                showToast(err.message || 'Registration failed', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Account';
            }
        });
    }

    // 2. User Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;

            if (!email || !password) {
                showToast('Please enter both email and password', 'error');
                return;
            }

            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Logging in...';

            try {
                const res = await apiRequest('/auth/login', 'POST', { email, password });

                if (res.success) {
                    setAuth(res.token, res.user);
                    showToast(`Welcome back, ${res.user.name}!`, 'success');
                    
                    setTimeout(() => {
                        if (res.user.role === 'admin') {
                            window.location.href = '/admin/users.html';
                        } else if (res.user.role === 'organiser') {
                            window.location.href = '/admin/dashboard.html';
                        } else {
                            window.location.href = '/events.html';
                        }
                    }, 1000);
                }
            } catch (err) {
                showToast(err.message || 'Invalid email or password', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Login to EventSphere';
            }
        });
    }
});
