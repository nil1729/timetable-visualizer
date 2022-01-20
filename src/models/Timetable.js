const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
	shareID: { type: String, unique: true, required: true },
	scheduledCourses: [
		{
			courseCode: { type: String },
			lecturesSection: {
				section: { type: String },
				dhString: { type: String },
				timings: [
					{
						day: { type: String },
						dayCode: { type: String },
						time: { type: String },
					},
				],
				instructors: { type: Array },
				roomNumber: { type: String },
			},
			tutorialsSection: {
				section: { type: String },
				dhString: { type: String },
				timings: [
					{
						day: { type: String },
						dayCode: { type: String },
						time: { type: String },
					},
				],
				instructors: { type: Array },
				roomNumber: { type: String },
			},
			labsSection: {
				section: { type: String },
				dhString: { type: String },
				timings: [
					{
						day: { type: String },
						dayCode: { type: String },
						time: { type: String },
					},
				],
				instructors: { type: Array },
				roomNumber: { type: String },
			},
		},
	],
});

module.exports = mongoose.model('Timetable', timetableSchema);
