const mongoose = require("mongoose");

module.exports = async () => {
  try {
    const conn = await mongoose.connect(process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    });

    console.log(`Database Connected (${conn.connection.name}): ${conn.connection.host}`);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};
