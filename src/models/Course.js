const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
	courseNo: { type: Number },
	courseCode: { type: String },
	courseName: { type: String },
	units: { type: Number },
	comprehensiveExamDate: { type: Date },
	labs: [
		{
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
	lectures: {
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
	tutorials: {
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
});

module.exports = mongoose.model('Course', courseSchema);
