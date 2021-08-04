const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
	courseNo: { type: Number },
	courseCode: { type: String },
	courseName: { type: String },
	units: { type: Number },
	comprehensiveExamDate: { type: Date },
	labs: [
		{
			newSection: { type: Boolean, default: false },
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
		},
	],
	IC: { type: String },
	lectures: [
		{
			newSection: { type: Boolean, default: false },
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
		},
	],
	tutorials: [
		{
			newSection: { type: Boolean, default: false },
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
		},
	],
});

module.exports = mongoose.model('Course', courseSchema);
