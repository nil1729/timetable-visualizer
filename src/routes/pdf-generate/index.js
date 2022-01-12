const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const generateTimetableAPI = require('../../../timetable-generator/generator');
const generateParsedArrayForPDF = require('../../../timetable-generator/generateParsedArrayForPDF');

router.post('/generate-timetable', async (req, res) => {
	try {
		let timetableArray = generateParsedArrayForPDF(generateTimetableAPI(req.body));
		const browser = await puppeteer.launch({
			headless: true,
			args: ['--no-sandbox'],
		});
		const page = await browser.newPage();
		const pageHTML = setUpTimetableTemplate(timetableArray);
		await page.setContent(pageHTML);

		const pdfBuffer = await page.pdf({ format: 'A4', landscape: true });

		await page.close();
		await browser.close();

		res.set('Content-Type', 'application/pdf');
		res.send(pdfBuffer);
	} catch (error) {
		console.log(error);
		return res.status(400).json({ error: error.message });
	}
});

const setUpTimetableTemplate = (timetableArray) => {
	const templateHTML = fs.readFileSync(path.join(__dirname, 'timetable.ejs'), 'utf8');
	const mainHTML = ejs.render(templateHTML, {
		timetableArray,
	});
	return mainHTML;
};

module.exports = router;
