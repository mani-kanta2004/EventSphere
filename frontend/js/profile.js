/* User Profile Update Handler */

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;

    fetchUserProfile();

    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('profile-name').value.trim();
            const phone = document.getElementById('profile-phone').value.trim();

            if (!name || !phone) {
                showToast('Name and Phone are required', 'error');
                return;
            }

            const submitBtn = profileForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Saving Changes...';

            try {
                const res = await apiRequest('/auth/profile', 'PUT', { name, phone }, true);
                if (res.success && res.user) {
                    const currentAuth = getUser();
                    setAuth(getToken(), { ...currentAuth, ...res.user });
                    renderNavbar();
                    showToast('Profile updated successfully!', 'success');
                }
            } catch (err) {
                showToast(err.message || 'Failed to update profile', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Save Changes';
            }
        });
    }
});

async function fetchUserProfile() {
    try {
        const res = await apiRequest('/auth/me', 'GET', null, true);
        if (res.success && res.user) {
            const user = res.user;
            if (document.getElementById('profile-name')) document.getElementById('profile-name').value = user.name || '';
            if (document.getElementById('profile-email')) document.getElementById('profile-email').value = user.email || '';
            if (document.getElementById('profile-phone')) document.getElementById('profile-phone').value = user.phone || '';
            if (document.getElementById('profile-role')) document.getElementById('profile-role').value = (user.role || 'user').toUpperCase();
            if (document.getElementById('profile-created')) document.getElementById('profile-created').value = formatDate(user.createdAt);
        }
    } catch (err) {
        showToast('Failed to load user profile', 'error');
    }
}
