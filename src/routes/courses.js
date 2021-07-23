const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Timetable = require('../models/Timetable');
const _ = require('lodash');
const DEFAULT_LIMIT = Number(process.env.PAGE_LIMIT);
const DEFAULT_PAGE = Number(process.env.PAGE_START);
const { isValidObjectId } = require('mongoose');
const { ObjectId } = require('mongodb');
const randomstring = require('randomstring');

/**
 *
 * @route /api/v1/courses
 *
 * @query limit - Number of courses to be showed in one page
 * @query page - Which page to show
 * @query search - Any keywords to search among courses
 * @query sort - Sorting field (units, name)
 * @query order - Sorting order
 *
 */

router.get('/', async (req, res) => {
	try {
		const { limit, page, sort, order, search } = req.query;
		const regexTester = new RegExp('' || search, 'gi');

		let queryArr = [
			{
				$addFields: {
					nameSearchResult: { $regexMatch: { input: '$courseName', regex: regexTester } },
					codeSearchResult: { $regexMatch: { input: '$courseCode', regex: regexTester } },
				},
			},
			{
				$match: { $or: [{ nameSearchResult: true }, { codeSearchResult: true }] },
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
			{
				$sort: { courseCode: 1 },
			},
		];

		// Pagination
		let requestedPage = Number(page);
		let requestedLimit = Number(limit);

		requestedPage = _.isInteger(requestedPage) && requestedPage > 1 ? requestedPage : DEFAULT_PAGE;
		requestedLimit =
			_.isInteger(requestedLimit) && (requestedLimit > 0 || requestedLimit <= 25)
				? requestedLimit
				: DEFAULT_LIMIT;

		queryArr.push(
			{
				$facet: {
					metadata: [
						{ $count: 'totalCourses' },
						{
							$addFields: {
								page: requestedPage,
								limit: requestedLimit,
								totalPages: { $ceil: { $divide: ['$totalCourses', requestedLimit] } },
							},
						},
					],
					data: [{ $skip: (requestedPage - 1) * requestedLimit }, { $limit: requestedLimit }], // add projection here wish you re-shape the docs
				},
			},
			{
				$project: {
					metadata: {
						$cond: {
							if: { $gt: [{ $size: '$metadata' }, Number(0)] },
							then: { $first: '$metadata' },
							else: {
								totalCourses: 0,
								page: requestedPage,
								limit: requestedLimit,
								totalPages: 0,
							},
						},
					},
					data: 1,
				},
			}
		);

		let output = await Course.aggregate(queryArr);
		return res.status(200).json(output[0]);
	} catch (error) {
		console.log(error);
	}
});

/**
 *
 * @route /api/v1/courses/:course_static_id
 *
 * @params course_static_id - Mongo Object ID of the course
 *
 */
router.get('/:course_static_id', async (req, res) => {
	try {
		if (!isValidObjectId(req.params.course_static_id)) throw new Error('Course ID is not valid!');

		let queryArr = [
			{
				$match: { _id: ObjectId(req.params.course_static_id) },
			},
			{
				$addFields: {
					lecturesCount: { $size: '$lectures' },
					tutorialsCount: { $size: '$tutorials' },
					labsCount: { $size: '$labs' },
				},
			},
			{
				$project: {
					__v: 0,
				},
			},
		];

		let output = await Course.aggregate(queryArr);

		if (output.length === 0) throw new Error('No courses found with given ID');
		return res.status(200).json(output[0]);
	} catch (error) {
		console.log(error);
	}
});

/**
 *
 * @route /api/v1/export-timetable
 *
 */
router.post('/export-timetable', async (req, res, next) => {
	let desiredDoc = { shareID: '', scheduledCourses: [] };

	try {
		const scheduledCourses = req.body;

		if (!Array.isArray(scheduledCourses)) throw new Error('Invalid Timetable');

		for (let i = 0; i < scheduledCourses.length; i++) {
			if (isValidObjectId(scheduledCourses[i]._id)) {
				const requiredCourse = await Course.findOne({ _id: scheduledCourses[i]._id }, { _id: 1 });

				if (!requiredCourse) throw new Error('Scheduled course not found');

				desiredDoc.scheduledCourses.push({
					course: requiredCourse._id,
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
 * @route /api/v1/export-timetable
 *
 */
router.get('/import-timetable/:share_id', async (req, res, next) => {
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
					let: { courseID: '$scheduledCourses.course' },
					pipeline: [
						{
							$match: {
								$expr: {
									$and: [{ $eq: ['$_id', '$$courseID'] }],
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

module.exports = router;
