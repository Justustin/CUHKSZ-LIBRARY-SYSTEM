// hashPassword.js

const bcrypt = require('bcrypt');

const hashPassword = async (plainPassword) => {
    const saltRounds = 10; // You can adjust the number of salt rounds as needed
    try {
        const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
        console.log(`Hashed Password: ${hashedPassword}`);
    } catch (error) {
        console.error('Error hashing password:', error);
    }
};

// Replace 'YourSecurePassword' with the actual password you want to hash
hashPassword('Librarian123');
