if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;
const connectDB = require('./config/db');
const courseRoutes = require('./src/routes/courses');

app.use(express.json());
app.use('/api/v1/courses', courseRoutes);

app.listen(PORT, async () => {
	await connectDB();
	console.log(`Server started on port ${PORT}`);
});
