require("dotenv").config();

const app = require("./app");
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');


const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});