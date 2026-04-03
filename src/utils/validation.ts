export const validate = {
  email: (email: string): string | null => {
    if (!email) return 'Email is required';
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) return 'Enter a valid email address';
    return null;
  },

  password: (password: string): string | null => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    return null;
  },

  name: (name: string): string | null => {
    if (!name || !name.trim()) return 'Full name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    return null;
  },

  phone: (phone: string): string | null => {
    if (!phone) return 'Phone number is required';
    const re = /^[+]?[0-9]{10,13}$/;
    if (!re.test(phone.replace(/\s/g, ''))) return 'Enter a valid phone number';
    return null;
  },
};
