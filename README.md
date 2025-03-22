Library Management System
A comprehensive web-based library management system designed to handle resource management, user roles, and borrowing operations efficiently. The system supports two user roles: Librarians and Patrons, each with tailored functionalities.

Features
General Features
User Authentication: Secure login/registration with JWT token-based authentication.

Responsive Design: Accessible on various devices with a clean user interface.

Role-Based Access Control:

Librarians: Manage resources, users, and oversee library operations.

Patrons: Search, borrow, and renew resources.

Librarian Features
Resource Management:

Add, edit, or delete library resources (books, journals, etc.).

Track total and available copies.

User Management:

Create, update, or delete user accounts.

Assign roles (Librarian/Patron).

Patron Features
Search & Borrow:

Search resources by title, author, or ISBN.

Borrow available resources with due date tracking.

Renewals:

Renew borrowed items (up to 2 times per resource).

Installation
Prerequisites
Node.js v14+

MySQL database

Git

Steps
Clone the Repository:

bash
Copy
git clone https://github.com/yourusername/library-management-system.git
cd library-management-system
Backend Setup:

bash
Copy
cd backend
npm install
Create a .env file in the backend directory:

Copy
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=library_db
JWT_SECRET=your_jwt_secret_key
PORT=5000
Start the backend server:

bash
Copy
node server.js
Frontend Setup:

Serve the frontend files using a static server (e.g., live-server):

bash
Copy
npm install -g live-server
cd frontend
live-server --port=3000
Access the application at http://localhost:3000.

Database Setup:

Run the provided SQL script to create tables or use Sequelize migrations (if applicable).

Manually insert an initial librarian account via MySQL:

sql
Copy
INSERT INTO Users (username, email, password, first_name, last_name, role)
VALUES ('admin', 'admin@library.com', 'hashed_password', 'Admin', 'User', 'Librarian');
Usage
Registration & Login:

Patrons can register via the registration page.

Librarians must be created by existing librarians via the dashboard.

Librarian Dashboard:

Manage resources (add/edit/delete).

Create/update user accounts.

View all borrowed resources.

Patron Dashboard:

Search for resources.

Borrow/renew items (up to 2 renewals per item).

View current borrowings with due dates.

API Endpoints
Authentication
POST /api/auth/register: Register a new user (Patron).

POST /api/auth/login: Authenticate and receive a JWT token.

Librarian Routes
Resources:

GET /api/librarian/get-resources: List all resources.

POST /api/librarian/add-resource: Add a new resource.

PUT /api/librarian/edit-resource/:id: Update a resource.

DELETE /api/librarian/delete-resource/:id: Delete a resource.

Users:

GET /api/librarian/get-all-users: List all users.

POST /api/librarian/create-user: Create a new user.

PUT /api/librarian/manage-user/:id: Update a user.

DELETE /api/librarian/delete-user/:id: Delete a user.

Patron Routes
GET /api/patron/search?query=...: Search resources.

POST /api/patron/borrow: Borrow a resource.

PUT /api/patron/renew-borrowing/:id: Renew a borrowing.

Technologies Used
Frontend: HTML5, CSS3, Vanilla JavaScript

Backend: Node.js, Express.js

Database: MySQL (with Sequelize ORM)

Authentication: JSON Web Tokens (JWT)

Security: Bcrypt for password hashing

Contributing
Fork the repository.

Create a feature branch: git checkout -b feature/new-feature.

Commit changes: git commit -m 'Add new feature'.

Push to the branch: git push origin feature/new-feature.

Submit a pull request.

Future Enhancements
Overdue item notifications via email.

Fine calculation for late returns.

Advanced search filters.

Reservation system for unavailable items.

License
This project is licensed under the MIT License. See LICENSE for details.

Acknowledgments: Thanks to the open-source community for providing invaluable tools and libraries.
