const VERSION = 1;
const fs = require('fs');
const path = require('path');
const bufferFile = fs.readFileSync(path.join(__dirname, '..', 'data', `v${VERSION}.json`));
let JSONData = bufferFile.toString();
const tt = JSON.parse(JSONData);
let totalCourses = [];

// DayCode to Full Day
const daysMapper = {
	M: 'Monday',
	T: 'Tuesday',
	W: 'Wednesday',
	Th: 'Thursday',
	F: 'Friday',
	S: 'Saturday',
};

// Class Hours to actual timings
const hoursMapper = {
	1: '08:00 - 08:50',
	2: '09:00 - 09:50',
	3: '10:00 - 10:50',
	4: '11:00 - 11:50',
	5: '12:00 - 12:50',
	6: '13:00 - 13:50',
	7: '14:00 - 14:50',
	8: '15:00 - 15:50',
	9: '16:00 - 16:50',
	10: '17:00 - 17:50',
	11: '18:00 - 18:50',
	12: '19:00 - 19:50',
};

// Extract only Course Object
tt.forEach((obj, index) => {
	if (obj['COM COD'].trim().length > 0) {
		obj.startIndex = index;
		totalCourses.push(obj);
	}
});

// iterate through all courses and extract all objects related to this course from the whole Array
for (let i = 0; i < totalCourses.length; i++) {
	let currObj = totalCourses[i];
	let nextObjStart = i + 1 === totalCourses.length ? tt.length : totalCourses[i + 1].startIndex;
	let courseArr = tt.slice(currObj.startIndex, nextObjStart); // all course related objects together

	// replicate Course Objects
	let courseNo = currObj['COM COD'],
		courseCode = currObj['COURSE NO.'],
		courseName = currObj['COURSE TITLE'],
		units = currObj['U'],
		comprehensiveExamDate = currObj['COMPRE DATE & SESSION'];

	// Course Object
	let course = {
		courseNo,
		courseCode,
		courseName,
		units,
		comprehensiveExamDate,
	};

	// Check for Lectures
	let lectures = { exists: false };
	lectures.sections = [];
	for (let j = 0; j < courseArr.length; j++) {
		if (courseArr[j]['SEC'].startsWith('L')) {
			lectures.exists = true;
			lectures.sections.push({
				...courseArr[j],
				startIndex: j,
			});
		}
	}

	// Tutorials Checks
	let tutorial = { exists: false };
	tutorial.sections = [];
	for (let j = 0; j < courseArr.length; j++) {
		if (courseArr[j]['SEC'].startsWith('T')) {
			tutorial.exists = true;
			tutorial.sections.push({
				...courseArr[j],
				startIndex: j,
			});
		}
	}

	// Practical Checks
	let practical = { exists: false };
	practical.sections = [];
	for (let j = 0; j < courseArr.length; j++) {
		if (courseArr[j]['SEC'].startsWith('P')) {
			practical.exists = true;
			practical.sections.push({
				...courseArr[j],
				startIndex: j,
			});
		}
	}

	/**
	 *  Check both and slicing
	 * 	set START and END index for lectures, tutorials, labs
	 *
	 */
	if (!tutorial.exists && !practical.exists) {
		lectures.endIndex = courseArr.length;
	} else if (tutorial.exists && !practical.exists) {
		lectures.endIndex = tutorial.sections[0].startIndex;
		tutorial.endIndex = courseArr.length;
	} else if (!tutorial.exists && practical.exists) {
		lectures.endIndex = practical.sections[0].startIndex;
		practical.endIndex = courseArr.length;
	} else if (tutorial.exists && practical.exists) {
		if (tutorial.sections[0].startIndex > practical.sections[0].startIndex) {
			lectures.endIndex = practical.sections[0].startIndex;
			tutorial.endIndex = courseArr.length;
			practical.endIndex = tutorial.sections[0].startIndex;
		} else {
			lectures.endIndex = tutorial.sections[0].startIndex;
			tutorial.endIndex = practical.sections[0].startIndex;
			practical.endIndex = courseArr.length;
		}
	}

	// Storing all profs for the particular course
	let profs = [];

	// if lecture exists
	if (lectures.exists) {
		for (let j = 0; j < lectures.sections.length; j++) {
			let currSec = lectures.sections[j];
			let nextSecStartIndex =
				j + 1 === lectures.sections.length
					? lectures.endIndex
					: lectures.sections[j + 1].startIndex;

			let lecArr = courseArr.slice(currSec.startIndex, nextSecStartIndex);

			let section = currSec['SEC'],
				time = currSec['DAYS & HOURS'],
				roomNumber = currSec['ROOM'],
				instructors = [];

			lecArr.forEach((l) => instructors.push(l['INSTRUCTOR-IN-CHARGE /Instructor']));
			profs.push(...instructors);

			lectures.sections[j] = {
				section,
				time,
				instructors,
				roomNumber,
			};
		}

		course.lectures = lectures.sections;
	}

	// if Tutorials exists
	if (tutorial.exists) {
		for (let j = 0; j < tutorial.sections.length; j++) {
			let currSec = tutorial.sections[j];
			let nextSecStartIndex =
				j + 1 === tutorial.sections.length
					? tutorial.endIndex
					: tutorial.sections[j + 1].startIndex;

			let lecArr = courseArr.slice(currSec.startIndex, nextSecStartIndex);

			let section = currSec['SEC'],
				time = currSec['DAYS & HOURS'],
				roomNumber = currSec['ROOM'],
				instructors = [];

			lecArr.forEach((l) => instructors.push(l['INSTRUCTOR-IN-CHARGE /Instructor']));
			profs.push(...instructors);

			tutorial.sections[j] = {
				section,
				time,
				instructors,
				roomNumber,
			};
		}

		course.tutorials = tutorial.sections;
	}

	// if labs exists
	if (practical.exists) {
		for (let j = 0; j < practical.sections.length; j++) {
			let currSec = practical.sections[j];
			let nextSecStartIndex =
				j + 1 === practical.sections.length
					? practical.endIndex
					: practical.sections[j + 1].startIndex;

			let lecArr = courseArr.slice(currSec.startIndex, nextSecStartIndex);

			let section = currSec['SEC'],
				time = currSec['DAYS & HOURS'],
				roomNumber = currSec['ROOM'],
				instructors = [];

			lecArr.forEach((l) => instructors.push(l['INSTRUCTOR-IN-CHARGE /Instructor']));
			profs.push(...instructors);

			practical.sections[j] = {
				section,
				time,
				instructors,
				roomNumber,
			};
		}

		course.labs = practical.sections;
	}

	// Finding IC
	for (let j = 0; j < profs.length; j++) {
		if (profs[j] === profs[j].toUpperCase()) {
			course.IC = profs[j];
			break;
		}
	}

	// Lastly assigned it to current Object
	totalCourses[i] = course;
}

// Comprehensive Exam Date parser
function parseCompreDate(str) {
	let [dt, session] = str.split(' ');
	let [d, m] = dt.split('/');
	let y = new Date().getFullYear();

	let date = `${y}-${m}-${d}`;
	let time = '9:00';
	if (session === 'AN') time = '14:00';

	return new Date(`${date}:${time}`);
}

// Capitalize the profs name
function capitalize(str) {
	if (!str || str.trim().length === 0) return 'TBA';
	return str
		.split(' ')
		.map((part) => {
			if (part.toUpperCase() === '(RS)') return part;
			let p = part && part.toLowerCase();
			let f = p[0] && p[0].toUpperCase();
			let l = p && p.slice(1);
			return `${f}${l}`;
		})
		.join(' ');
}

// Parsing lecture and tutorials timings
function parseLecTutTiming(str) {
	let arr = str.split(' ').filter((i) => i.length !== 0);
	let timings = [];

	for (let i = 0; i < arr.length; i++) {
		// if it is a letter
		if (isNaN(parseInt(arr[i]))) {
			timings.push({
				day: daysMapper[arr[i]],
				dayCode: arr[i],
				time: null,
			});
		} else {
			let lastPos = timings.length - 1;
			let minPos = 0;
			while (lastPos >= minPos) {
				if (!timings[lastPos].time) timings[lastPos].time = hoursMapper[arr[i]];
				lastPos--;
			}
		}
	}
	return timings;
}

// Parsing Lab Timings
function parseLabTiming(str) {
	let arr = str.split(' ').filter((i) => i.length !== 0);
	let timings = [];
	let hours = [];

	for (let i = 0; i < arr.length; i++) {
		// check for letters
		if (isNaN(parseInt(arr[i]))) {
			timings.push({
				day: daysMapper[arr[i]],
				dayCode: arr[i],
				time: null,
			});
		} else hours.push(arr[i]);
	}

	let fHour = hoursMapper[hours[0]].slice(0, 5),
		lHour = hoursMapper[hours[hours.length - 1]].slice(-5);

	timings.forEach((it) => {
		if (!it.time) {
			it.time = `${fHour} - ${lHour}`;
		}
	});

	return timings;
}

function newSectionParse(section) {
	if (section && section.trim().length > 0) {
		let isNew = section.lastIndexOf('N') === section.length - 1;
		return { isNew, section: isNew ? section.substring(0, section.length - 1) : section };
	} else return { isNew: false, section };
}

// Refactor the whole course array for better understanding
for (let i = 0; i < totalCourses.length; i++) {
	let course = totalCourses[i];

	if (course.comprehensiveExamDate.trim().length > 0) {
		course.comprehensiveExamDate = parseCompreDate(course.comprehensiveExamDate);
	}
	course.courseNo = parseInt(course.courseNo);
	course.units = parseInt(course.units);
	if (course.IC) course.IC = capitalize(course.IC);

	let lectures = [],
		tutorials = [],
		labs = [];

	// refactor lectures
	if (course.lectures) {
		course.lectures.forEach((lec) => {
			let timings = parseLecTutTiming(lec.time);
			let instructors = lec.instructors.map((i) => capitalize(i));
			lectures.push({
				section: newSectionParse(lec.section).section,
				dhString: lec.time,
				timings,
				instructors,
				newSection: newSectionParse(lec.section).isNew,
				roomNumber: lec.roomNumber,
			});
		});
	}

	// refactor tutorials
	if (course.tutorials) {
		course.tutorials.forEach((tut) => {
			let timings = parseLecTutTiming(tut.time);
			let instructors = tut.instructors.map((i) => capitalize(i));
			tutorials.push({
				section: newSectionParse(tut.section).section,
				dhString: tut.time,
				timings,
				instructors,
				newSection: newSectionParse(tut.section).isNew,
				roomNumber: tut.roomNumber,
			});
		});
	}

	// refactor Labs
	if (course.labs) {
		course.labs.forEach((lab) => {
			// console.log(lab);
			let timings = parseLabTiming(lab.time);
			let instructors = lab.instructors.map((i) => capitalize(i));
			labs.push({
				section: newSectionParse(lab.section).section,
				dhString: lab.time,
				timings,
				instructors,
				newSection: newSectionParse(lab.section).isNew,
				roomNumber: lab.roomNumber,
			});
		});
	}

	course.lectures = lectures;
	course.tutorials = tutorials;
	course.labs = labs;

	totalCourses[i] = course;
}

fs.writeFileSync(
	path.join(__dirname, '..', 'data', `courses-v${VERSION}.json`),
	JSON.stringify(totalCourses),
	'utf8'
);
