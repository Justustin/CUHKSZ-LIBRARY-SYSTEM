# 📚 Library Management System

![MIT License](https://img.shields.io/badge/License-MIT-green.svg)  
![Node.js Version](https://img.shields.io/badge/Node.js-16%2B-blue)  
![MySQL Ready](https://img.shields.io/badge/MySQL-Compatible-orange)

A modern web-based library management system with elegant workflows for librarians and patrons. Built with ❤️ using Node.js and MySQL.

![System Preview](https://via.placeholder.com/800x400.png?text=Library+System+Interface)

## 🌟 Key Features

### 🧑💻 Librarian Portal
| Feature                | Description                                                                 |
|------------------------|-----------------------------------------------------------------------------|
| 📖 Resource Management | Full CRUD operations for books/journals with inventory tracking            |
| 👥 User Administration | Create/update patron accounts with role-based access control               |
| 📊 Analytics Dashboard | Visualize borrowing patterns and resource availability                     |

### 👨🎓 Patron Portal
| Feature                | Description                                                                 |
|------------------------|-----------------------------------------------------------------------------|
| 🔍 Advanced Search     | Fuzzy search by title/author/ISBN with auto-suggest                        |
| 🕒 Self-Service        | Borrow/renew items (2 renewals max) with due date reminders                |
| 📚 Borrowing History   | Track current/past borrowings with return status                           |

## 🚀 Installation Guide

### Prerequisites
- Node.js 16+
- MySQL 8+
- Git

### Step-by-Step Setup
```bash
# Clone repository
git clone https://github.com/yourusername/library-management-system.git
cd library-management-system

# Install dependencies
cd backend && npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Initialize database
npm run db:setup

# Start development server
npm run start:dev
