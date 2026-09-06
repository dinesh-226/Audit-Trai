require("dotenv").config();

const app = require("./app");
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const auditLogRoutes = require('./routes/auditLogs');




const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/audit-logs', auditLogRoutes);


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});