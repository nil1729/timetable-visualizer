const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Timetable = require('../models/Timetable');
const _ = require('lodash');
const { isValidObjectId } = require('mongoose');
const randomstring = require('randomstring');
const generateTimetableAPI = require('../../timetable-generator/generator');
const generateFileICS = require('../../timetable-generator/generateICS');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

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

/**
 *
 * @route /api/v1/timetable/generate-timetable
 *
 */
router.post('/generate-timetable', async (req, res, next) => {
	try {
		let result = await generateTimetableAPI(req.body);
		return res.json(result);
	} catch (e) {
		console.log(e);
	}
});

/**
 *
 * @route /api/v1/timetable/generate/ics-file
 *
 */
router.post('/generate/ics-file', async (req, res, next) => {
	try {
		const { scheduledCourses, userChoice, userEmail } = req.body;

		if (!['download', 'email'].includes(userChoice))
			throw new Error('Please choose a valid type to send ics file to you');

		if (!Array.isArray(scheduledCourses) && scheduledCourses.length === 0)
			throw new Error('Invalid Timetable');

		const fileName = randomstring.generate({ length: 20, charset: 'alphanumeric' });
		generateFileICS(scheduledCourses, fileName);

		if (userChoice === 'email') {
			const output = `
				<p>Please find attached the .ics file for your timetable. Open the .ics file using your phone to directly import the file onto Google Calendar.</p>
				<p>
					Best Regards,
					<br/>
					Timetable Companion Team
				</p>
			`;

			let transporter = nodemailer.createTransport({
				service: 'gmail',
				auth: {
					user: process.env.SENDER_MAIL,
					pass: process.env.SENDER_MAIL_PASSWORD,
				},
			});

			let mailOptions = {
				from: `Timetable Companion <${process.env.SENDER_MAIL}>`,
				to: userEmail,
				subject: 'Your Timetable Schedule',
				html: output,
				attachments: [
					{
						filename: 'timetable-schedule.ics',
						path: path.join(__dirname, `../../tmp/${fileName}.ics`),
					},
				],
			};

			const response = await transporter.sendMail(mailOptions);

			// Email Logs for further development if encounter any bug on production
			const mailLogsArr = fs.existsSync(process.env.MAIL_LOG_FILE)
				? JSON.parse(fs.readFileSync(process.env.MAIL_LOG_FILE).toString())
				: [];
			mailLogsArr.push(response);
			fs.writeFileSync(process.env.MAIL_LOG_FILE, JSON.stringify(mailLogsArr));

			res.status(200).json({
				success: true,
				message: 'Email sent successfully',
			});
		} else {
			const icsBuffer = fs.readFileSync(`tmp/${fileName}.ics`);
			res.set('Content-Type', 'text/calendar');
			res.send(icsBuffer);
		}
		fs.unlinkSync(`tmp/${fileName}.ics`);
		return;
	} catch (e) {
		return res.status(400).json({ error: error.message });
	}
});

module.exports = router;
