const express = require("express");
const mongoose = require("mongoose");
const app = express();
app.use(express.json()); 

//connect to mongoDB
mongoose.connect("mongodb://127.0.0.1:27017/testdb", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.error("Mongo Error:", err));


// define Schema and model
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        minlength: [2, "Name must be at least 2 characters long"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        match: [/.+\@.+\..+/, "Please enter a valid email address"]
    },
    age: {
        type: Number,
        required: [true, "Age is required"],
        min: [1, "Age must be at least 1"]
    },
    role: {
        type: String,
        enum: ["admin","user"],
        default: "user"
    }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);



// GET /users → Fetch all users
app.get("/users", async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// GET /users/:id → Fetch user by ID
app.get("/users/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (err) {
        res.status(400).json({ error: "Invalid user ID" });
    }
});

// POST /users → Create new user
app.post("/users", async (req, res) => {
    try {
        const newUser = new User(req.body);
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (err) {
        if (err.name === "ValidationError") {
            const messages = Object.values(err.errors).map(e => e.message);
            res.status(400).json({ errors: messages });
        } else if (err.code === 11000) {
            res.status(400).json({ error: "Email already exists" });
        } else {
            res.status(500).json({ error: "Server error" });
        }
    }
});

// PUT /users/:id → Update user
app.put("/users/:id", async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedUser) return res.status(404).json({ error: "User not found" });
        res.json(updatedUser);
    } catch (err) {
        if (err.name === "ValidationError") {
            const messages = Object.values(err.errors).map(e => e.message);
            res.status(400).json({ errors: messages });
        } else {
            res.status(400).json({ error: "Invalid user ID" });
        }
    }
});

// DELETE /users/:id → Delete user
app.delete("/users/:id", async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ error: "User not found" });
        res.json({ message: "User deleted successfully" });
    } catch (err) {
        res.status(400).json({ error: "Invalid user ID" });
    }
});

// GET /users/admins → Fetch all admins
app.get("/users/admin", async (req, res) =>
{
    try {
        const admins = await User.find({ role: "admin"});
        res.json(admins);
    } catch (err)
    {
        res.status(500).json({error: "Server error"});
    }
});

// GET /users/average-age → Return average age of users
app.get("/users/average-age", async (req, res) =>
{
    try
    {
        const result = await User.aggregate([
            {$group: {_id: null, avgAge: {$avg: "&age"}}}
        ]);
        const average = result.length > 0 ? result[0].avgAge: 0;
        res.json({ averageAge: average});
    } catch (err) 
    {
        res.status(500).json({ error: "Server error"});
    }
});

// port
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
