// frontend/scripts.js

document.addEventListener('DOMContentLoaded', () => {
    // ============================
    // Helper Functions
    // ============================

    /**
     * Display a message in a specified div.
     * @param {HTMLElement} element - The div where the message will be displayed.
     * @param {string} message - The message to display.
     * @param {string} type - The type of message ('success' or 'error').
     */
    const displayMessage = (element, message, type) => {
        element.innerHTML = message;
        if (type === 'success') {
            element.style.backgroundColor = '#d4edda';
            element.style.color = '#155724';
            element.style.border = '1px solid #c3e6cb';
        } else if (type === 'error') {
            element.style.backgroundColor = '#f8d7da';
            element.style.color = '#721c24';
            element.style.border = '1px solid #f5c6cb';
        }
    };

    /**
     * Check if the user is authenticated by verifying the presence of a token.
     * @returns {boolean} - Returns true if authenticated, else false.
     */
    const isAuthenticated = () => {
        return !!localStorage.getItem('token');
    };

    /**
     * Get the user's role from localStorage.
     * @returns {string|null} - Returns the user's role or null if not found.
     */
    const getUserRole = () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user).role : null;
    };

    /**
     * Redirect the user to the login page if not authenticated.
     */
    const protectPage = () => {
        if (!isAuthenticated()) {
            window.location.href = 'login.html';
        }
    };

    // ============================
    // Modal Declarations
    // ============================

    const renewConfirmationModal = document.getElementById('renewConfirmationModal');
    const closeRenewModalButton = document.getElementById('closeRenewModal');
    const confirmRenewButton = document.getElementById('confirmRenewButton');
    const cancelRenewButton = document.getElementById('cancelRenewButton');
    let borrowingIdToRenew = null;

    // ============================
    // Registration Functionality
    // ============================

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const messageDiv = document.getElementById('message');
            messageDiv.innerHTML = '';

            const username = document.getElementById('username').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const first_name = document.getElementById('first_name').value.trim();
            const last_name = document.getElementById('last_name').value.trim();

            // Basic Frontend Validation
            if (!username || !email || !password || !first_name || !last_name) {
                displayMessage(messageDiv, 'Please fill in all fields.', 'error');
                return;
            }

            try {
                const response = await fetch('http://localhost:5000/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password, first_name, last_name })
                });

                const data = await response.json();

                if (response.ok) {
                    displayMessage(messageDiv, data.msg, 'success');
                    registerForm.reset();
                } else {
                    // Handle Validation Errors from Backend
                    if (data.errors && Array.isArray(data.errors)) {
                        const errorMessages = data.errors.map(err => err.msg).join('<br>');
                        displayMessage(messageDiv, errorMessages, 'error');
                    } else {
                        displayMessage(messageDiv, data.msg || 'Registration failed.', 'error');
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                displayMessage(messageDiv, 'An error occurred. Please try again.', 'error');
            }
        });
    }

    // ============================
    // Login Functionality
    // ============================

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const messageDiv = document.getElementById('message');
            messageDiv.innerHTML = '';

            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            // Basic Frontend Validation
            if (!username || !password) {
                displayMessage(messageDiv, 'Please enter both username and password.', 'error');
                return;
            }

            try {
                const response = await fetch('http://localhost:5000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok) {
                    displayMessage(messageDiv, 'Login successful! Redirecting...', 'success');
                    // Store token and user info in localStorage
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));

                    // Redirect based on role after a short delay
                    setTimeout(() => {
                        if (data.user.role === 'Librarian') {
                            window.location.href = 'librarian_dashboard.html';
                        } else if (data.user.role === 'Patron') {
                            window.location.href = 'patron_dashboard.html';
                        }
                    }, 1500);
                } else {
                    // Handle Validation Errors from Backend
                    if (data.errors && Array.isArray(data.errors)) {
                        const errorMessages = data.errors.map(err => err.msg).join('<br>');
                        displayMessage(messageDiv, errorMessages, 'error');
                    } else {
                        displayMessage(messageDiv, data.msg || 'Login failed.', 'error');
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                displayMessage(messageDiv, 'An error occurred. Please try again.', 'error');
            }
        });
    }

    // ============================
    // Logout Functionality
    // ============================

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            const confirmLogout = confirm('Are you sure you want to logout?');
            if (confirmLogout) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
            }
        });
    }
    
    /**
     * Function to fetch resources from the backend.
     */
    const fetchResources = async () => {
        const messageDiv = document.getElementById('viewResourcesMessage');
        messageDiv.innerHTML = '';
        const token = localStorage.getItem('token');
        if (!token) {
            displayMessage(messageDiv, 'Unauthorized. Please log in as a librarian.', 'error');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/librarian/get-resources', {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                populateResourcesTable(data);
            } else {
                // Handle Errors from Backend
                if (data.errors && Array.isArray(data.errors)) {
                    const errorMessages = data.errors.map(err => err.msg).join('<br>');
                    displayMessage(messageDiv, errorMessages, 'error');
                } else {
                    displayMessage(messageDiv, data.msg || 'Failed to fetch resources.', 'error');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            displayMessage(messageDiv, 'An error occurred. Please try again.', 'error');
        }
    };
    // ============================
    // Librarian Dashboard Functionality
    // ============================

    // Protect Librarian Dashboard
    if (window.location.pathname.includes('librarian_dashboard.html')) {
        protectPage();
        const role = getUserRole();
        if (role !== 'Librarian') {
            alert('Access denied: You do not have permission to view this page.');
            window.location.href = 'login.html';
        }

        // Fetch and display existing resources
        fetchResources();
    }

    // Handle Add Resource Form Submission
    const addResourceForm = document.getElementById('addResourceForm');
    if (addResourceForm) {
        addResourceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const messageDiv = document.getElementById('addResourceMessage');
            messageDiv.innerHTML = '';

            const token = localStorage.getItem('token');
            if (!token) {
                displayMessage(messageDiv, 'Unauthorized. Please log in as a librarian.', 'error');
                return;
            }

            const title = document.getElementById('title').value.trim();
            const author = document.getElementById('author').value.trim();
            const isbn = document.getElementById('isbn').value.trim();
            const resource_type = document.getElementById('resource_type').value;
            const total_copies = parseInt(document.getElementById('total_copies').value);
            const available_copies = parseInt(document.getElementById('available_copies').value);
            const location = document.getElementById('location').value.trim();

            // Basic Frontend Validation
            if (!title || !author || !isbn || !resource_type || isNaN(total_copies) || isNaN(available_copies) || !location) {
                displayMessage(messageDiv, 'Please fill in all fields correctly.', 'error');
                return;
            }

            try {
                const response = await fetch('http://localhost:5000/api/librarian/add-resource', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ title, author, isbn, resource_type, total_copies, available_copies, location })
                });

                const data = await response.json();

                if (response.ok) {
                    displayMessage(messageDiv, data.msg, 'success');
                    addResourceForm.reset();
                    fetchResources(); // Refresh the resources list
                } else {
                    // Handle Validation Errors from Backend
                    if (data.errors && Array.isArray(data.errors)) {
                        const errorMessages = data.errors.map(err => err.msg).join('<br>');
                        displayMessage(messageDiv, errorMessages, 'error');
                    } else {
                        displayMessage(messageDiv, data.msg || 'Failed to add resource.', 'error');
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                displayMessage(messageDiv, 'An error occurred. Please try again.', 'error');
            }
        });
    }


    /**
     * Function to populate the resources table with data.
     * @param {Array} resources - Array of resource objects.
     */
    const populateResourcesTable = (resources) => {
        const resourcesTableBody = document.querySelector('#resourcesTable tbody');
        resourcesTableBody.innerHTML = ''; // Clear existing rows

        if (resources.length === 0) {
            resourcesTableBody.innerHTML = '<tr><td colspan="8">No resources available.</td></tr>';
            return;
        }

        resources.forEach(resource => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${resource.title}</td>
                <td>${resource.author}</td>
                <td>${resource.isbn}</td>
                <td>${resource.resource_type}</td>
                <td>${resource.total_copies}</td>
                <td>${resource.available_copies}</td>
                <td>${resource.location}</td>
                <td>
                    <button class="action-button edit-button" data-id="${resource.resource_id}">Edit</button>
                    <button class="action-button delete-button" data-id="${resource.resource_id}">Delete</button>
                </td>
            `;

            // Add event listeners for Edit and Delete buttons
            const editButton = row.querySelector('.edit-button');
            const deleteButton = row.querySelector('.delete-button');

            editButton.addEventListener('click', () => openEditModal(resource));
            deleteButton.addEventListener('click', () => openDeleteModal(resource.resource_id));

            resourcesTableBody.appendChild(row);
        });
    };

    // ============================
    // Edit Resource Functionality
    // ============================

    const editResourceModal = document.getElementById('editResourceModal');
    const closeEditModalButton = document.getElementById('closeEditModal');

    /**
     * Function to open the edit resource modal and populate fields.
     * @param {Object} resource - The resource object to edit.
     */
    const openEditModal = (resource) => {
        editResourceModal.classList.remove('hidden');
        document.getElementById('edit_resource_id').value = resource.resource_id;
        document.getElementById('edit_title').value = resource.title;
        document.getElementById('edit_author').value = resource.author;
        document.getElementById('edit_isbn').value = resource.isbn;
        document.getElementById('edit_resource_type').value = resource.resource_type;
        document.getElementById('edit_total_copies').value = resource.total_copies;
        document.getElementById('edit_available_copies').value = resource.available_copies;
        document.getElementById('edit_location').value = resource.location;
    };

    /**
     * Function to close the edit resource modal.
     */
    const closeEditModal = () => {
        editResourceModal.classList.add('hidden');
        const editResourceMessage = document.getElementById('editResourceMessage');
        if (editResourceMessage) {
            editResourceMessage.innerHTML = '';
        }
        const editResourceForm = document.getElementById('editResourceForm');
        if (editResourceForm) {
            editResourceForm.reset();
        }
    };

    if (closeEditModalButton) {
        closeEditModalButton.addEventListener('click', closeEditModal);
    }
    // Function to clear messages
    function clearMessage(element) {
        element.innerHTML = '';
    }
    // Handle Edit Resource Form Submission
    const editResourceForm = document.getElementById('editResourceForm');
    if (editResourceForm) {
        editResourceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const messageDiv = document.getElementById('editResourceMessage');
            clearMessage(messageDiv);

        const token = localStorage.getItem('token');
        if (!token) {
            displayMessage(messageDiv, 'Unauthorized. Please log in as a librarian.', 'error');
            return;
        }

        const resource_id = document.getElementById('edit_resource_id').value;
        const title = document.getElementById('edit_title').value.trim();
        const author = document.getElementById('edit_author').value.trim();
        const isbn = document.getElementById('edit_isbn').value.trim();
        const resource_type = document.getElementById('edit_resource_type').value;
        const total_copies = parseInt(document.getElementById('edit_total_copies').value, 10);
        const available_copies = parseInt(document.getElementById('edit_available_copies').value, 10);
        const location = document.getElementById('edit_location').value.trim();

        // Basic Frontend Validation
        if (!title || !author || !isbn || !resource_type || isNaN(total_copies) || isNaN(available_copies) || !location) {
            displayMessage(messageDiv, 'Please fill in all fields correctly.', 'error');
            return;
        }

        // Ensure available_copies does not exceed total_copies
        if (available_copies > total_copies) {
            displayMessage(messageDiv, 'Available copies cannot exceed total copies.', 'error');
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/librarian/edit-resource/${resource_id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, author, isbn, resource_type, total_copies, available_copies, location })
            });

            // Handle non-JSON responses gracefully
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error(`Server responded with non-JSON data: ${text}`);
            }

            if (response.ok) {
                displayMessage(messageDiv, data.msg, 'success');
                editResourceForm.reset();
                closeEditModal(); // Ensure this function exists to close the modal
                fetchResources(); // Refresh the resources list
            } else {
                // Handle Validation Errors from Backend
                if (data.errors && Array.isArray(data.errors)) {
                    const errorMessages = data.errors.map(err => err.msg).join('<br>');
                    displayMessage(messageDiv, errorMessages, 'error');
                } else {
                    displayMessage(messageDiv, data.msg || 'Failed to update resource.', 'error');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            displayMessage(messageDiv, `An error occurred: ${error.message}`, 'error');
        }
    });
}

// Real-time Validation for Available Copies vs. Total Copies
const totalCopiesInput = document.getElementById('edit_total_copies');
const availableCopiesInput = document.getElementById('edit_available_copies');
const editSubmitButton = document.getElementById('editSubmitButton'); // Ensure your submit button has this ID

function validateCopies() {
    const total = parseInt(totalCopiesInput.value, 10);
    const available = parseInt(availableCopiesInput.value, 10);
    const messageDiv = document.getElementById('editResourceMessage');

    // Clear previous messages
    clearMessage(messageDiv);

    // Check if both fields have valid numbers
    if (!isNaN(total) && !isNaN(available)) {
        if (available > total) {
            displayMessage(messageDiv, 'Available copies cannot exceed total copies.', 'error');
            availableCopiesInput.classList.add('input-error'); // Optional: Add CSS class for visual feedback
            if (editSubmitButton) {
                editSubmitButton.disabled = true;
            }
            return;
        }
    }

    // Remove error indicators if validation passes
    availableCopiesInput.classList.remove('input-error'); // Optional: Remove CSS class
    if (editSubmitButton) {
        editSubmitButton.disabled = false;
    }
}

// Attach real-time validation event listeners
if (totalCopiesInput && availableCopiesInput) {
    totalCopiesInput.addEventListener('input', validateCopies);
    availableCopiesInput.addEventListener('input', validateCopies);
}
    // ============================
    // Delete Resource Functionality
    // ============================

    const deleteResourceModal = document.getElementById('deleteResourceModal');
    const closeDeleteModalButton = document.getElementById('closeDeleteModal');
    const cancelDeleteButton = document.getElementById('cancelDeleteButton');
    let resourceIdToDelete = null;

    /**
     * Function to open the delete confirmation modal.
     * @param {string} resource_id - The ID of the resource to delete.
     */
    const openDeleteModal = (resource_id) => {
        resourceIdToDelete = resource_id;
        deleteResourceModal.classList.remove('hidden');
    };

    /**
     * Function to close the delete confirmation modal.
     */
    const closeDeleteModal = () => {
        deleteResourceModal.classList.add('hidden');
        resourceIdToDelete = null;
    };

    if (closeDeleteModalButton && cancelDeleteButton) {
        closeDeleteModalButton.addEventListener('click', closeDeleteModal);
        cancelDeleteButton.addEventListener('click', closeDeleteModal);
    }

    // Handle Delete Confirmation
    const confirmDeleteButton = document.getElementById('confirmDeleteButton');
    if (confirmDeleteButton) {
        confirmDeleteButton.addEventListener('click', async () => {
            if (!resourceIdToDelete) return;

            const messageDiv = document.getElementById('viewResourcesMessage');
            messageDiv.innerHTML = '';
            const token = localStorage.getItem('token');
            if (!token) {
                displayMessage(messageDiv, 'Unauthorized. Please log in as a librarian.', 'error');
                return;
            }

            try {
                const response = await fetch(`http://localhost:5000/api/librarian/delete-resource/${resourceIdToDelete}`, {
                    method: 'DELETE',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();

                if (response.ok) {
                    displayMessage(messageDiv, data.msg, 'success');
                    closeDeleteModal();
                    resourceIdToDelete = null;
                    fetchResources(); // Refresh the resources list
                } else {
                    // Handle Errors from Backend
                    if (data.errors && Array.isArray(data.errors)) {
                        const errorMessages = data.errors.map(err => err.msg).join('<br>');
                        displayMessage(messageDiv, errorMessages, 'error');
                    } else {
                        displayMessage(messageDiv, data.msg || 'Failed to delete resource.', 'error');
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                displayMessage(messageDiv, 'An error occurred. Please try again.', 'error');
            }
        });
    }
    

    // ============================
// Modal Control Functionality
// ============================

// Add User Modal Controls
const addUserButton = document.getElementById('openCreateUserModal');
const createUserModal = document.getElementById('createUserModal');
const closeCreateUserModalButton = document.getElementById('closeCreateUserModal');

if (addUserButton) {
    addUserButton.addEventListener('click', () => {
        createUserModal.classList.remove('hidden');
    });
}

if (closeCreateUserModalButton) {
    closeCreateUserModalButton.addEventListener('click', () => {
        createUserModal.classList.add('hidden');
    });
}

// Edit User Modal Controls
const closeEditUserModalButton = document.getElementById('closeEditUserModal');
const editUserModal = document.getElementById('editUserModal');

if (closeEditUserModalButton) {
    closeEditUserModalButton.addEventListener('click', () => {
        editUserModal.classList.add('hidden');
    });
}

// Delete User Modal Controls
const closeDeleteUserModalButton = document.getElementById('closeDeleteUserModal');
const deleteUserModal = document.getElementById('deleteUserModal');
const cancelDeleteUserButton = document.getElementById('cancelDeleteUserButton');

if (closeDeleteUserModalButton) {
    closeDeleteUserModalButton.addEventListener('click', () => {
        deleteUserModal.classList.add('hidden');
    });
}

if (cancelDeleteUserButton) {
    cancelDeleteUserButton.addEventListener('click', () => {
        deleteUserModal.classList.add('hidden');
    });
}

// Close Modals When Clicking Outside the Modal Content
window.addEventListener('click', (event) => {
    if (event.target === createUserModal) {
        createUserModal.classList.add('hidden');
    } else if (event.target === editUserModal) {
        editUserModal.classList.add('hidden');
    } else if (event.target === deleteUserModal) {
        deleteUserModal.classList.add('hidden');
    }
});


    // ============================
    // User Management Functionality
    // ============================

    /**
     * Function to fetch all users from the backend.
     */
    const fetchAllUsers = async () => {
        const messageDiv = document.getElementById('allUsersMessage');
        clearMessage(messageDiv);
        const token = localStorage.getItem('token');
        if (!token) {
            displayMessage(messageDiv, 'Unauthorized. Please log in as a librarian.', 'error');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/librarian/get-all-users', {
                method: 'GET',
                headers: { 
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                populateUsersTable(data);
            } else {
                // Handle Errors from Backend
                if (data.errors && Array.isArray(data.errors)) {
                    const errorMessages = data.errors.map(err => err.msg).join('<br>');
                    displayMessage(messageDiv, errorMessages, 'error');
                } else {
                    displayMessage(messageDiv, data.msg || 'Failed to fetch users.', 'error');
                }
            }
        } catch (error) {
            console.error('Fetch All Users Error:', error);
            displayMessage(messageDiv, 'An error occurred. Please try again.', 'error');
        }
    };

    /**
     * Function to populate the users table with data.
     * @param {Array} users - Array of user objects.
     */
    const populateUsersTable = (users) => {
        const usersTableBody = document.querySelector('#usersTable tbody');
        usersTableBody.innerHTML = ''; // Clear existing rows

        if (users.length === 0) {
            usersTableBody.innerHTML = '<tr><td colspan="7">No users found.</td></tr>';
            return;
        }

        users.forEach(user => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${user.user_id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.first_name}</td>
                <td>${user.last_name}</td>
                <td>${user.role}</td>
                <td>
                    <button class="action-button edit-button" data-id="${user.user_id}">Edit</button>
                    <button class="action-button delete-button" data-id="${user.user_id}">Delete</button>
                </td>
            `;

            // Add event listeners for Edit and Delete buttons
            const editButton = row.querySelector('.edit-button');
            const deleteButton = row.querySelector('.delete-button');

            editButton.addEventListener('click', () => openEditUserModal(user));
            deleteButton.addEventListener('click', () => openDeleteUserModal(user.user_id));

            usersTableBody.appendChild(row);
        });
    };

    /**
     * Function to create a new user.
     * @param {Object} userData - The data of the user to create.
     */
    const createUserFunction = async (userData) => { // Renamed to avoid conflict
        const messageDiv = document.getElementById('createUserMessage');
        clearMessage(messageDiv);
        const token = localStorage.getItem('token');
        if (!token) {
            displayMessage(messageDiv, 'Unauthorized. Please log in as a librarian.', 'error');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/librarian/create-user', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (response.ok) {
                displayMessage(messageDiv, data.msg, 'success');
                document.getElementById('createUserForm').reset();
                fetchAllUsers(); // Refresh the users list
            } else {
                // Handle Errors from Backend
                if (data.errors && Array.isArray(data.errors)) {
                    const errorMessages = data.errors.map(err => err.msg).join('<br>');
                    displayMessage(messageDiv, errorMessages, 'error');
                } else {
                    displayMessage(messageDiv, data.msg || 'Failed to create user.', 'error');
                }
                console.error('Create User Error:', data.msg);
            }
        } catch (error) {
            console.error('Create User Error:', error);
            displayMessage(messageDiv, 'An error occurred. Please try again.', 'error');
        }
    };

    // Handle Create User Form Submission
    const createUserForm = document.getElementById('createUserForm');
    if (createUserForm) {
        createUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const messageDiv = document.getElementById('createUserMessage');
            clearMessage(messageDiv);

            const username = document.getElementById('new_username').value.trim();
            const email = document.getElementById('new_email').value.trim();
            const password = document.getElementById('new_password').value;
            const first_name = document.getElementById('new_first_name').value.trim();
            const last_name = document.getElementById('new_last_name').value.trim();
            const role = document.getElementById('new_role').value;

            // Basic Frontend Validation
            if (!username || !email || !password || !first_name || !last_name || !role) {
                displayMessage(messageDiv, 'Please fill in all fields.', 'error');
                return;
            }

            const userData = { username, email, password, first_name, last_name, role };
            await createUserFunction(userData);
        });
    }

    /**
     * Function to open the edit user modal and populate fields.
     * @param {Object} user - The user object to edit.
     */
    const openEditUserModal = (user) => {
        const editUserModal = document.getElementById('editUserModal');
        editUserModal.classList.remove('hidden');

        document.getElementById('edit_user_id').value = user.user_id;
        document.getElementById('edit_username').value = user.username;
        document.getElementById('edit_email').value = user.email;
        document.getElementById('edit_password').value = ''; // Leave blank if not updating password
        document.getElementById('edit_first_name').value = user.first_name;
        document.getElementById('edit_last_name').value = user.last_name;
        document.getElementById('edit_role').value = user.role;
    };

    // Handle Edit User Form Submission
    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        editUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const messageDiv = document.getElementById('editUserMessage');
            clearMessage(messageDiv);

            const userId = document.getElementById('edit_user_id').value;
            const username = document.getElementById('edit_username').value.trim();
            const email = document.getElementById('edit_email').value.trim();
            const password = document.getElementById('edit_password').value; // Optional
            const first_name = document.getElementById('edit_first_name').value.trim();
            const last_name = document.getElementById('edit_last_name').value.trim();
            const role = document.getElementById('edit_role').value;

            // Basic Frontend Validation
            if (!username || !email || !first_name || !last_name || !role) {
                displayMessage(messageDiv, 'Please fill in all required fields.', 'error');
                return;
            }

            // Validate role
            const validRoles = ['Librarian', 'Patron'];
            if (!validRoles.includes(role)) {
                displayMessage(messageDiv, `Role must be one of the following: ${validRoles.join(', ')}.`, 'error');
                return;
            }

            // Prepare updated data
            const updatedData = { username, email, first_name, last_name, role };
            if (password) {
                updatedData.password = password; // Include password only if it's being updated
            }

            await updateUser(userId, updatedData);
        });
    }

    /**
     * Function to update an existing user.
     * @param {string} userId - The ID of the user to update.
     * @param {Object} updatedData - The updated user data.
     */
    const updateUser = async (userId, updatedData) => { // Renamed to avoid conflict
        const messageDiv = document.getElementById('editUserMessage');
        clearMessage(messageDiv);
        const token = localStorage.getItem('token');
        if (!token) {
            displayMessage(messageDiv, 'Unauthorized. Please log in as a librarian.', 'error');
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/librarian/manage-user/${userId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedData)
            });

            const data = await response.json();

            if (response.ok) {
                displayMessage(messageDiv, data.msg, 'success');
                editUserForm.reset();
                closeEditUserModal(); // Close the modal
                fetchAllUsers(); // Refresh the users list
            } else {
                // Handle Errors from Backend
                if (data.errors && Array.isArray(data.errors)) {
                    const errorMessages = data.errors.map(err => err.msg).join('<br>');
                    displayMessage(messageDiv, errorMessages, 'error');
                } else {
                    displayMessage(messageDiv, data.msg || 'Failed to update user.', 'error');
                }
                console.error('Update User Error:', data.msg);
            }
        } catch (error) {
            console.error('Update User Error:', error);
            displayMessage(messageDiv, 'An error occurred. Please try again.', 'error');
        }
    };

    /**
     * Function to open the delete user confirmation modal.
     * @param {string} userId - The ID of the user to delete.
     */
    const openDeleteUserModal = (userId) => {
        const deleteUserModal = document.getElementById('deleteUserModal');
        deleteUserModal.classList.remove('hidden');
        deleteUserModal.setAttribute('data-user-id', userId);
    };

    // Handle Delete User Confirmation
    const confirmDeleteUserButton = document.getElementById('confirmDeleteUserButton');
    if (confirmDeleteUserButton) {
        confirmDeleteUserButton.addEventListener('click', async () => {
            const deleteUserModal = document.getElementById('deleteUserModal');
            const userId = deleteUserModal.getAttribute('data-user-id');
            if (!userId) return;

            await deleteUser(userId);
        });
    }

    /**
     * Function to delete a user.
     * @param {string} userId - The ID of the user to delete.
     */
    const deleteUser = async (userId) => { // Renamed to avoid conflict
        const messageDiv = document.getElementById('deleteUserMessage');
        clearMessage(messageDiv);
        const token = localStorage.getItem('token');
        if (!token) {
            displayMessage(messageDiv, 'Unauthorized. Please log in as a librarian.', 'error');
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/librarian/delete-user/${userId}`, {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                displayMessage(messageDiv, data.msg, 'success');
                closeDeleteUserModal(); // Close the modal
                fetchAllUsers(); // Refresh the users list
            } else {
                // Handle Errors from Backend
                if (data.errors && Array.isArray(data.errors)) {
                    const errorMessages = data.errors.map(err => err.msg).join('<br>');
                    displayMessage(messageDiv, errorMessages, 'error');
                } else {
                    displayMessage(messageDiv, data.msg || 'Failed to delete user.', 'error');
                }
                console.error('Delete User Error:', data.msg);
            }
        } catch (error) {
            console.error('Delete User Error:', error);
            displayMessage(messageDiv, 'An error occurred. Please try again.', 'error');
        }
    };

    /**
     * Function to close the edit user modal.
     */
    const closeEditUserModal = () => {
        const editUserModal = document.getElementById('editUserModal');
        editUserModal.classList.add('hidden');
        const editUserMessage = document.getElementById('editUserMessage');
        if (editUserMessage) {
            clearMessage(editUserMessage);
        }
        const editUserForm = document.getElementById('editUserForm');
        if (editUserForm) {
            editUserForm.reset();
        }
    };

    /**
     * Function to close the delete user modal.
     */
    const closeDeleteUserModal = () => {
        const deleteUserModal = document.getElementById('deleteUserModal');
        deleteUserModal.classList.add('hidden');
        deleteUserModal.removeAttribute('data-user-id');
        const deleteUserMessage = document.getElementById('deleteUserMessage');
        if (deleteUserMessage) {
            clearMessage(deleteUserMessage);
        }
    };

    /**
     * Handle Create User Form Submission
     */
    const createUserFormElement = document.getElementById('createUserForm');
    if (createUserFormElement) {
        createUserFormElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            const messageDiv = document.getElementById('createUserMessage');
            clearMessage(messageDiv);

            const username = document.getElementById('new_username').value.trim();
            const email = document.getElementById('new_email').value.trim();
            const password = document.getElementById('new_password').value;
            const first_name = document.getElementById('new_first_name').value.trim();
            const last_name = document.getElementById('new_last_name').value.trim();
            const role = document.getElementById('new_role').value;

            // Basic Frontend Validation
            if (!username || !email || !password || !first_name || !last_name || !role) {
                displayMessage(messageDiv, 'Please fill in all fields.', 'error');
                return;
            }

            const userData = { username, email, password, first_name, last_name, role };
            await createUserFunction(userData);
        });
    }

    /**
     * Function to fetch all users from the backend.
     */
    const fetchAllUsersFunction = async () => {
        const messageDiv = document.getElementById('allUsersMessage');
        clearMessage(messageDiv);
        const token = localStorage.getItem('token');
        if (!token) {
            displayMessage(messageDiv, 'Unauthorized. Please log in as a librarian.', 'error');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/librarian/get-all-users', {
                method: 'GET',
                headers: { 
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                populateUsersTable(data);
            } else {
                // Handle Errors from Backend
                if (data.errors && Array.isArray(data.errors)) {
                    const errorMessages = data.errors.map(err => err.msg).join('<br>');
                    displayMessage(messageDiv, errorMessages, 'error');
                } else {
                    displayMessage(messageDiv, data.msg || 'Failed to fetch users.', 'error');
                }
            }
        } catch (error) {
            console.error('Fetch All Users Error:', error);
            displayMessage(messageDiv, 'An error occurred. Please try again.', 'error');
        }
    };

    /**
     * Function to populate the users table with data.
     * @param {Array} users - Array of user objects.
     */
    const populateUsersTableFunction = (users) => { // Renamed to avoid conflict
        const usersTableBody = document.querySelector('#usersTable tbody');
        usersTableBody.innerHTML = ''; // Clear existing rows

        if (users.length === 0) {
            usersTableBody.innerHTML = '<tr><td colspan="7">No users found.</td></tr>';
            return;
        }

        users.forEach(user => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${user.user_id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.first_name}</td>
                <td>${user.last_name}</td>
                <td>${user.role}</td>
                <td>
                    <button class="action-button edit-user-button" data-id="${user.user_id}">Edit</button>
                    <button class="action-button delete-user-button" data-id="${user.user_id}">Delete</button>
                </td>
            `;

            // Add event listeners for Edit and Delete buttons
            const editButton = row.querySelector('.edit-user-button');
            const deleteButton = row.querySelector('.delete-user-button');

            editButton.addEventListener('click', () => openEditUserModal(user));
            deleteButton.addEventListener('click', () => openDeleteUserModal(user.user_id));

            usersTableBody.appendChild(row);
        });
    };


    // Fetch All Users on Page Load for Librarian Dashboard
    if (window.location.pathname.includes('librarian_dashboard.html')) {
        fetchAllUsers();
    }

    // ============================
    // Patron Dashboard Functionality
    // ============================

    // Protect Patron Dashboard
    if (window.location.pathname.includes('patron_dashboard.html')) {
        protectPage();
        const role = getUserRole();
        if (role !== 'Patron') {
            alert('Access denied: You do not have permission to view this page.');
            window.location.href = 'login.html';
        }
        // Optionally, fetch and display borrowed books on page load
        fetchBorrowedBooks();
    }

    // ============================
    // Fetch and Display Borrowed Books
    // ============================

    /**
     * Function to fetch borrowed books from the backend.
     */
    async function fetchBorrowedBooks() {
        const messageDiv = document.getElementById('borrowedBooksMessage');
        messageDiv.innerHTML = '';
        const token = localStorage.getItem('token');
        if (!token) {
            displayMessage(messageDiv, 'Unauthorized. Please log in as a patron.', 'error');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/patron/get-borrowed-books', {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                populateBorrowedBooksTable(data);
            } else {
                // Handle Errors from Backend
                if (data.errors && Array.isArray(data.errors)) {
                    const errorMessages = data.errors.map(err => err.msg).join('<br>');
                    displayMessage(messageDiv, errorMessages, 'error');
                } else {
                    displayMessage(messageDiv, data.msg || 'Failed to fetch borrowed books.', 'error');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            displayMessage(messageDiv, 'An error occurred. Please try again.', 'error');
        }
    };

    /**
     * Function to populate the borrowed books table with data.
     * @param {Array} borrowedBooks - Array of borrowed book objects.
     */
    const populateBorrowedBooksTable = (borrowedBooks) => {
        const borrowedBooksTableBody = document.querySelector('#borrowedBooksTable tbody');
        borrowedBooksTableBody.innerHTML = ''; // Clear existing rows

        if (borrowedBooks.length === 0) {
            borrowedBooksTableBody.innerHTML = '<tr><td colspan="8">No borrowed books.</td></tr>';
            return;
        }

        borrowedBooks.forEach(borrowing => {
            const row = document.createElement('tr');

            const borrowDate = new Date(borrowing.borrow_date).toLocaleDateString();
            const dueDate = new Date(borrowing.due_date).toLocaleDateString();

            row.innerHTML = `
                <td>${borrowing.title}</td>
                <td>${borrowing.author}</td>
                <td>${borrowing.isbn}</td>
                <td>${borrowing.resource_type}</td>
                <td>${borrowDate}</td>
                <td>${dueDate}</td>
                <td>${borrowing.renewals}</td>
                <td>
                    <button class="renew-button" data-id="${borrowing.borrowing_id}" ${borrowing.renewals >= 2 ? 'disabled title="Maximum renewals reached"' : ''}>
                        Renew
                    </button>
                </td>
            `;

            // Add event listener for Renew button
            const renewButton = row.querySelector('.renew-button');
            if (borrowing.renewals < 2) {
                renewButton.addEventListener('click', () => openRenewModal(borrowing.borrowing_id));
            }

            borrowedBooksTableBody.appendChild(row);
        });
    };

    // ============================
    // Renew Borrowing Functionality
    // ============================

    /**
     * Function to open the renew confirmation modal.
     * @param {string} borrowing_id - The ID of the borrowing to renew.
     */
    const openRenewModal = (borrowing_id) => {
        borrowingIdToRenew = borrowing_id;
        renewConfirmationModal.classList.remove('hidden');
    };

    /**
     * Function to close the renew confirmation modal.
     */
    const closeRenewModal = () => {
        renewConfirmationModal.classList.add('hidden');
        borrowingIdToRenew = null;
    };

    if (closeRenewModalButton && cancelRenewButton) {
        closeRenewModalButton.addEventListener('click', closeRenewModal);
        cancelRenewButton.addEventListener('click', closeRenewModal);
    }

    // Handle Renew Confirmation
    if (confirmRenewButton) {
        confirmRenewButton.addEventListener('click', async () => {
            if (!borrowingIdToRenew) return;

            const messageDiv = document.getElementById('borrowedBooksMessage');
            messageDiv.innerHTML = '';
            const token = localStorage.getItem('token');
            if (!token) {
                displayMessage(messageDiv, 'Unauthorized. Please log in as a patron.', 'error');
                return;
            }

            try {
                const response = await fetch(`http://localhost:5000/api/patron/renew-borrowing/${borrowingIdToRenew}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();

                if (response.ok) {
                    displayMessage(messageDiv, `Success! Borrowing renewed. New due date: ${new Date(data.new_due_date).toLocaleDateString()}`, 'success');
                    closeRenewModal();
                    fetchBorrowedBooks(); // Refresh the borrowed books list
                } else {
                    // Handle Errors from Backend
                    if (data.errors && Array.isArray(data.errors)) {
                        const errorMessages = data.errors.map(err => err.msg).join('<br>');
                        displayMessage(messageDiv, errorMessages, 'error');
                    } else {
                        displayMessage(messageDiv, data.msg || 'Failed to renew borrowing.', 'error');
                    }
                    closeRenewModal();
                }
            } catch (error) {
                console.error('Error:', error);
                displayMessage(messageDiv, 'An error occurred. Please try again.', 'error');
                closeRenewModal();
            }
        });
    }

    // ============================
    // Handle Search Form Submission
    // ============================

    const searchFormElement = document.getElementById('searchFormElement');
    if (searchFormElement) {
        searchFormElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            const searchQuery = document.getElementById('searchQuery').value.trim();
            const searchResultsDiv = document.getElementById('searchResults');
            searchResultsDiv.innerHTML = '';
            const messageDiv = document.getElementById('searchMessage');
            messageDiv.innerHTML = '';

            const token = localStorage.getItem('token');
            if (!token) {
                displayMessage(messageDiv, 'Unauthorized. Please log in as a patron.', 'error');
                console.log('Search attempt without authentication.');
                return;
            }

            // Basic Frontend Validation
            if (!searchQuery) {
                displayMessage(messageDiv, 'Please enter a search query.', 'error');
                console.log('Empty search query submitted.');
                return;
            }

            console.log(`Searching for books with query: "${searchQuery}"`);

            try {
                const response = await fetch(`http://localhost:5000/api/patron/search?query=${encodeURIComponent(searchQuery)}`, {
                    method: 'GET',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                console.log('Search API response status:', response.status);
                const data = await response.json();
                console.log('Search API response data:', data);

                if (response.ok) {
                    if (data.length === 0) {
                        displayMessage(messageDiv, 'No resources found.', 'error');
                        console.log('No resources found for the search query.');
                    } else {
                        // Create a grid to display books
                        const booksGrid = document.createElement('div');
                        booksGrid.classList.add('books-grid');

                        data.forEach(resource => {
                            const bookCard = document.createElement('div');
                            bookCard.classList.add('book-card');

                            // Placeholder image if no image is available
                            const bookImage = resource.image_url ? resource.image_url : 'assets/images/placeholder-book.png';

                            bookCard.innerHTML = `
                                <img src="${bookImage}" alt="${resource.title}">
                                <h3>${resource.title}</h3>
                                <p><strong>Author:</strong> ${resource.author}</p>
                                <p><strong>ISBN:</strong> ${resource.isbn}</p>
                                <p><strong>Available Copies:</strong> ${resource.available_copies}</p>
                                <button data-id="${resource.resource_id}" ${resource.available_copies < 1 ? 'disabled title="Unavailable"' : ''}>
                                    ${resource.available_copies < 1 ? 'Unavailable' : 'Borrow'}
                                </button>
                            `;

                            // Add event listener to the borrow button
                            const borrowButton = bookCard.querySelector('button');
                            if (resource.available_copies > 0) {
                                borrowButton.addEventListener('click', () => borrowBook(resource.resource_id));
                            }

                            booksGrid.appendChild(bookCard);
                        });

                        searchResultsDiv.appendChild(booksGrid);
                        console.log(`Displayed ${data.length} resources.`);
                    }
                } else {
                    // Handle Errors from Backend
                    if (data.errors && Array.isArray(data.errors)) {
                        const errorMessages = data.errors.map(err => err.msg).join('<br>');
                        displayMessage(messageDiv, errorMessages, 'error');
                        console.log('Search API errors:', errorMessages);
                    } else {
                        displayMessage(messageDiv, data.msg || 'Failed to fetch search results.', 'error');
                        console.log('Search API failed with message:', data.msg);
                    }
                }
            } catch (error) {
                console.error('Error during search:', error);
                displayMessage(messageDiv, 'An error occurred. Please try again.', 'error');
            }
        });
    }

    // ============================
    // Borrow Book Functionality
    // ============================

    /**
     * Function to handle borrowing a book.
     * @param {string} resource_id - The ID of the resource to borrow.
     */
    const borrowBook = async (resource_id) => {
        const confirmBorrow = confirm('Are you sure you want to borrow this book?');
        if (!confirmBorrow) return;

        const borrowMessageDiv = document.getElementById('borrowMessage');
        if (borrowMessageDiv) {
            borrowMessageDiv.innerHTML = '';
        }

        const token = localStorage.getItem('token');
        if (!token) {
            alert('Unauthorized. Please log in as a patron.');
            window.location.href = 'login.html';
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/patron/borrow', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ resource_id })
            });

            const data = await response.json();

            if (response.ok) {
                alert(`Success! Book borrowed. Due date: ${new Date(data.due_date).toLocaleDateString()}`);
                // Refresh the search results to update available copies
                const searchForm = document.getElementById('searchFormElement');
                if (searchForm) {
                    searchForm.dispatchEvent(new Event('submit'));
                }
                // Refresh the borrowed books table
                fetchBorrowedBooks();
            } else {
                // Handle Validation Errors from Backend
                if (data.errors && Array.isArray(data.errors)) {
                    const errorMessages = data.errors.map(err => err.msg).join('\n');
                    alert(`Error:\n${errorMessages}`);
                } else {
                    alert(`Error: ${data.msg || 'Failed to borrow the book.'}`);
                }
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while borrowing the book.');
        }
    };

    // ============================
    // Ensure Modals are Hidden on Page Load
    // ============================

    if (renewConfirmationModal) {
        renewConfirmationModal.classList.add('hidden');
    }
});
