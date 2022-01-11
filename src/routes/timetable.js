const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Timetable = require('../models/Timetable');
const _ = require('lodash');
const { isValidObjectId } = require('mongoose');
const randomstring = require('randomstring');
const generateTimetableAPI = require('../../timetable-generator/generator');

/**
 *
 * @route /api/v1/timetable/export
 *
 */
router.post('/export', async (req, res, next) => {
	let desiredDoc = { shareID: '', scheduledCourses: [] };

	try {
		const scheduledCourses = req.body;

		if (!Array.isArray(scheduledCourses)) throw new Error('Invalid Timetable');

		for (let i = 0; i < scheduledCourses.length; i++) {
			if (_.isString(scheduledCourses[i].courseCode)) {
				const requiredCourse = await Course.findOne(
					{ courseCode: scheduledCourses[i].courseCode },
					{ courseCode: 1 }
				);

				if (!requiredCourse) throw new Error('Scheduled course not found');

				desiredDoc.scheduledCourses.push({
					courseCode: requiredCourse.courseCode,
					tutorialsSection: scheduledCourses[i].tutorialsSection,
					labsSection: scheduledCourses[i].labsSection,
					lecturesSection: scheduledCourses[i].lecturesSection,
				});
			} else throw new Error('Invalid Course ID');
		}

		desiredDoc.shareID = await createShareID();
		await Timetable.create(desiredDoc);
		return res.status(200).json({ shareID: desiredDoc.shareID });
	} catch (error) {
		return res.status(400).json({ error: error.message });
	}
});

/**
 *
 * @route /api/v1/timetable/import/:share_id
 *
 */
router.get('/import/:share_id', async (req, res, next) => {
	try {
		const data = await Timetable.aggregate([
			{ $match: { shareID: req.params.share_id } },
			{
				$unwind: {
					path: '$scheduledCourses',
					includeArrayIndex: 'arrayIndex',
					preserveNullAndEmptyArrays: false,
				},
			},
			{
				$lookup: {
					from: 'courses',
					let: { courseCode: '$scheduledCourses.courseCode' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [{ $eq: ['$courseCode', '$$courseCode'] }],
								},
							},
						},
						{
							$project: {
								courseCode: 1,
								courseName: 1,
								units: 1,
								lectures: { $size: '$lectures' },
								tutorials: { $size: '$tutorials' },
								labs: { $size: '$labs' },
								comprehensiveExamDate: 1,
								IC: 1,
							},
						},
					],
					as: 'courseDetail',
				},
			},
			{
				$addFields: { 'scheduledCourses.courseDetail': { $first: '$courseDetail' } },
			},
			{
				$group: {
					_id: '$_id',
					shareID: { $first: '$shareID' },
					scheduledCourses: { $push: '$scheduledCourses' },
				},
			},
		]);
		if (data.length === 0) throw new Error('No timetable found with requested share ID');
		return res.status(200).json(data[0]);
	} catch (error) {
		return res.status(400).json({ error: error.message });
	}
});

const createShareID = async () => {
	try {
		let shareID;
		do {
			shareID = randomstring.generate().toUpperCase();
		} while (await Timetable.findOne({ shareID: shareID }));
		return shareID;
	} catch (error) {
		console.log(error);
	}
};

// Generate Timetable
router.post('/generate-timetable', async (req, res, next) => {
	try {
		let result = await generateTimetableAPI(req.body);
		return res.json(result);
	} catch (e) {
		console.log(e);
	}
});

module.exports = router;
