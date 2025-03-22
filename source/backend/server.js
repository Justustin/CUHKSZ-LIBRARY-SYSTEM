// backend/server.js

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const librarianRoutes = require('./routes/librarianRoutes');
const patronRoutes = require('./routes/patronRoutes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
// backend/server.js

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/librarian', librarianRoutes);
app.use('/api/patron', patronRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
