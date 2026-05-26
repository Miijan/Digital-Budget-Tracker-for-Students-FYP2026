const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

// Initialize the Express application
const app = express();

// Middleware to allow your frontend to talk to your backend
app.use(cors());
app.use(express.json());

// Set up the database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      // XAMPP default username
    password: '',      // XAMPP default password is blank
    database: 'budget_tracker_db'
});

// Test the database connection
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL database successfully!');
});

// --- USER REGISTRATION ENDPOINT ---
app.post('/register', (req, res) => {
    // 1. Grab the data sent from the frontend
    const { name, email, password } = req.body;

    // 2. Check if the user left any fields blank
    if (!name || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    // 3. Write the SQL command to insert the new user
    const sqlInsert = "INSERT INTO User (name, email, password) VALUES (?, ?, ?)";
    
    // 4. Execute the SQL command in your database
    db.query(sqlInsert, [name, email, password], (err, result) => {
        if (err) {
            // If the email already exists, MySQL throws an error
            console.error("Error inserting user:", err);
            return res.status(500).json({ error: "Error registering user. Email might already exist." });
        }
        // Send a success message back to the frontend
        res.status(201).json({ message: "User registered successfully!" });
    });
});

// --- USER LOGIN ENDPOINT ---
app.post('/login', (req, res) => {
    // 1. Grab the email and password sent from the frontend
    const { email, password } = req.body;

    // 2. Check if the user left any fields blank
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    // 3. Write the SQL command to find a user with this exact email and password
    const sqlSelect = "SELECT * FROM User WHERE email = ? AND password = ?";
    
    // 4. Execute the command
    db.query(sqlSelect, [email, password], (err, result) => {
        if (err) {
            console.error("Error during login:", err);
            return res.status(500).json({ error: "Internal server error" });
        }

        // 5. Check if we found a match
        if (result.length > 0) {
            // User exists and password is correct!
            // We send back the user data (like their user_id) so the frontend knows who logged in
            res.status(200).json({ message: "Login successful!", user: result[0] });
        } else {
            // No user found with that combination
            res.status(401).json({ error: "Invalid email or password" });
        }
    });
});

// ==========================================
//             EXPENSE ENDPOINTS
// ==========================================


// --- ADD EXPENSE ENDPOINT ---
app.post('/add-expense', (req, res) => {
    // 1. Grab the expense details from the frontend
    const { user_id, category_id, amount, date, description } = req.body;

    // 2. Make sure the required fields aren't empty
    if (!user_id || !category_id || !amount || !date) {
        return res.status(400).json({ error: "Please fill in all required fields" });
    }

    // 3. Write the SQL to insert the expense into the database
    const sqlInsert = "INSERT INTO Expense (user_id, category_id, amount, date, description) VALUES (?, ?, ?, ?, ?)";
    
    // 4. Execute the command
    db.query(sqlInsert, [user_id, category_id, amount, date, description], (err, result) => {
        if (err) {
            console.error("Error adding expense:", err);
            return res.status(500).json({ error: "Failed to add expense" });
        }
        res.status(201).json({ message: "Expense added successfully!" });
    });
});

// --- DELETE EXPENSE ENDPOINT ---
app.delete('/delete-expense/:id', (req, res) => {
    const expenseId = req.params.id;
    const sqlDelete = "DELETE FROM Expense WHERE expense_id = ?";
    
    db.query(sqlDelete, [expenseId], (err, result) => {
        if (err) {
            console.error("Error deleting expense:", err);
            return res.status(500).json({ error: "Failed to delete expense" });
        }
        res.status(200).json({ message: "Expense deleted successfully!" });
    });
});

// --- EDIT EXPENSE ENDPOINT ---
app.put('/edit-expense/:id', (req, res) => {
    const expenseId = req.params.id;
    const { category_id, amount, date, description } = req.body;

    const sqlUpdate = "UPDATE Expense SET category_id = ?, amount = ?, date = ?, description = ? WHERE expense_id = ?";
    
    db.query(sqlUpdate, [category_id, amount, date, description, expenseId], (err, result) => {
        if (err) {
            console.error("Error updating expense:", err);
            return res.status(500).json({ error: "Failed to update expense" });
        }
        res.status(200).json({ message: "Expense updated successfully!" });
    });
});

// --- GET EXPENSE HISTORY ENDPOINT ---
app.get('/expenses/:userId', (req, res) => {
    // 1. Grab the user ID from the URL itself
    const userId = req.params.userId;

    // 2. Write the SQL to grab all expenses for this user. 
    // We use a JOIN here to get the actual Category Name (like 'Food') instead of just the category_id number.
    const sqlSelect = `
        SELECT Expense.*, Category.category_name 
        FROM Expense 
        JOIN Category ON Expense.category_id = Category.category_id 
        WHERE Expense.user_id = ?
        ORDER BY Expense.date DESC
    `;
    
    // 3. Execute the command
    db.query(sqlSelect, [userId], (err, result) => {
        if (err) {
            console.error("Error fetching expenses:", err);
            return res.status(500).json({ error: "Failed to retrieve expenses" });
        }
        // Send the list of expenses back to the frontend
        res.status(200).json(result);
    });
});

// ==========================================
//           BUDGET ENDPOINTS
// ==========================================

// --- 1. SET OR UPDATE BUDGET ---
app.post('/set-budget', (req, res) => {
    const { user_id, total_amount, alert_limit1, alert_limit2 } = req.body;

    if (!user_id || !total_amount) {
        return res.status(400).json({ error: "User ID and Total Amount are required" });
    }

    // Check if user already has a budget
    db.query("SELECT budget_id FROM Budget WHERE user_id = ? LIMIT 1", [user_id], (err, result) => {
        if (err) {
            console.error("Error checking budget:", err);
            return res.status(500).json({ error: "Failed to set budget" });
        }

        if (result.length > 0) {
            // Update the existing budget instead of creating a new one
            const sqlUpdate = "UPDATE Budget SET total_amount = ?, remaining_amount = ?, alert_limit1 = ?, alert_limit2 = ? WHERE budget_id = ?";
            db.query(sqlUpdate, [total_amount, total_amount, alert_limit1, alert_limit2, result[0].budget_id], (err) => {
                if (err) {
                    console.error("Error updating budget:", err);
                    return res.status(500).json({ error: "Failed to update budget" });
                }
                res.status(200).json({ message: "Budget updated successfully!" });
            });
        } else {
            // First time — insert a new budget
            const sqlInsert = "INSERT INTO Budget (user_id, total_amount, remaining_amount, alert_limit1, alert_limit2) VALUES (?, ?, ?, ?, ?)";
            db.query(sqlInsert, [user_id, total_amount, total_amount, alert_limit1, alert_limit2], (err) => {
                if (err) {
                    console.error("Error creating budget:", err);
                    return res.status(500).json({ error: "Failed to set budget" });
                }
                res.status(201).json({ message: "Budget set successfully!" });
            });
        }
    });
});

// --- 2. GET USER BUDGET ---
app.get('/budget/:userId', (req, res) => {
    const userId = req.params.userId;

    const sqlSelect = "SELECT * FROM Budget WHERE user_id = ? ORDER BY budget_id DESC LIMIT 1";
    
    db.query(sqlSelect, [userId], (err, result) => {
        if (err) {
            console.error("Error fetching budget:", err);
            return res.status(500).json({ error: "Failed to retrieve budget" });
        }
        
        // If the user hasn't set a budget yet, send an empty response
        if (result.length === 0) {
            return res.status(200).json({ message: "No budget found" });
        }

        res.status(200).json(result[0]);
    });
});

// ==========================================
//        FINANCIAL GOALS ENDPOINTS
// ==========================================

// --- 1. ADD A NEW GOAL (Updated with Description) ---
app.post('/add-goal', (req, res) => {
    const { user_id, goal_name, description, target_amount, deadline } = req.body;
    const sqlInsert = "INSERT INTO Goal (user_id, goal_name, description, target_amount, saved_amount, deadline) VALUES (?, ?, ?, ?, 0.00, ?)";
    
    db.query(sqlInsert, [user_id, goal_name, description, target_amount, deadline], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to create goal" });
        res.status(201).json({ message: "Financial goal created successfully!" });
    });
});

// --- 2. GET USER GOALS ---
app.get('/goals/:userId', (req, res) => {
    const userId = req.params.userId;
    db.query("SELECT * FROM Goal WHERE user_id = ? ORDER BY deadline ASC", [userId], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to retrieve goals" });
        res.status(200).json(result);
    });
});

// --- 3. UPDATE GOAL PROGRESS ---
app.put('/update-goal/:id', (req, res) => {
    const goalId = req.params.id;
    const { add_amount } = req.body;
    const sqlUpdate = "UPDATE Goal SET saved_amount = saved_amount + ? WHERE goal_id = ?";
    
    db.query(sqlUpdate, [add_amount, goalId], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to update goal" });
        res.status(200).json({ message: "Goal updated successfully!" });
    });
});

// --- 4. DELETE GOAL ---
app.delete('/delete-goal/:id', (req, res) => {
    const goalId = req.params.id;
    db.query("DELETE FROM Goal WHERE goal_id = ?", [goalId], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to delete goal" });
        res.status(200).json({ message: "Goal deleted!" });
    });
});

// Start the server on port 3001
app.listen(3001, '0.0.0.0', () => {
    console.log('Backend server is running on port 3001 (all interfaces)');
});