const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const _ = require('lodash');
const DEFAULT_LIMIT = Number(process.env.PAGE_LIMIT);
const DEFAULT_PAGE = Number(process.env.PAGE_START);
const { isValidObjectId } = require('mongoose');
const { ObjectId } = require('mongodb');

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
 * @route /api/v1/courses/:course_code
 *
 * @params course_code - BITS Course Code for the course
 *
 */
router.get('/:course_code', async (req, res) => {
	try {
		let queryArr = [
			{
				$match: { courseCode: req.params.course_code },
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

router.get('/generate/course_details', async (req, res) => {
	try {
		const course_codes = req.query.course_codes;
		let valid_codes = course_codes.split(',').map((part) => part.trim());

		let queryArr = [
			{
				$match: { courseCode: { $in: valid_codes } },
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
		return res.status(200).json(output);
	} catch (error) {
		console.log(error);
	}
});

module.exports = router;
