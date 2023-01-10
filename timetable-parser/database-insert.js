const path = require("path");
const configFilePath = path.join("/opt/nil1729/timetable-visualizer/backend.env");
require("dotenv").config({ path: configFilePath });

const VERSION = 1;
const connectDB = require("../config/db");
const Courses = require("../src/models/Course");
const fs = require("fs");

const courseData = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", `courses-v${VERSION}.json`)));

const insertData = async () => {
  try {
    await connectDB();
    await Courses.deleteMany({});
    const result = await Courses.insertMany(courseData);
    console.log(result);
  } catch (error) {
    console.log(error);
  }
  process.exit(1);
};

if (process.argv[2] === "-i") {
  insertData();
}
