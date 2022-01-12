const parsedData = require('./newParsed.json');
let mapCourses = new Map();

for (let i = 0; i < parsedData.length; i++) {
	mapCourses.set(parsedData[i]['NO'], parsedData[i]);
}

const generateParsedArrayForPDF = (generatedTTs) => {
	const daysMap = {
		M: 0,
		T: 1,
		W: 2,
		Th: 3,
		F: 4,
		S: 5,
	};

	const timesMapping = {
		'08:00 - 08:50': 0,
		'09:00 - 09:50': 1,
		'10:00 - 10:50': 2,
		'11:00 - 11:50': 3,
		'12:00 - 12:50': 4,
		'13:00 - 13:50': 5,
		'14:00 - 14:50': 6,
		'15:00 - 15:50': 7,
		'16:00 - 16:50': 8,
		'17:00 - 17:50': 9,
		'18:00 - 18:50': 10,
		'19:00 - 19:50': 11,
	};
	let array2D = [];
	for (let i = 0; i < generatedTTs.scheduledCourses.length; i++) {
		let array2D_ = new Array(12);
		for (let i = 0; i < 12; i++) {
			array2D_[i] = new Array(6);
		}
		array2D.push(array2D_);
	}
	TTs = generatedTTs.scheduledCourses;
	TTs.forEach((TT_courses, index) => {
		TT_courses.forEach((TT) => {
			const lectures = TT.lecturesSection;
			const lecTimings = lectures.timings;
			for (let j = 0; j < lecTimings.length; j++) {
				array2D[index][timesMapping[lecTimings[j].time]][daysMap[lecTimings[j].dayCode]] = {
					courseCode: TT.courseCode,
					instructors: lectures.instructors,
					timing: lecTimings[j].time,
					section: lectures.section,
					courseTitle: mapCourses.get(TT.courseCode).TITLE,
				};
			}
			const tutorials = TT.tutorialsSection;
			const tutTimings = tutorials.timings;
			for (let j = 0; j < tutTimings.length; j++) {
				array2D[index][timesMapping[tutTimings[j].time]][daysMap[tutTimings[j].dayCode]] = {
					courseCode: TT.courseCode,
					instructors: tutorials.instructors,
					timing: tutTimings[j].time,
					section: tutorials.section,
					courseTitle: mapCourses.get(TT.courseCode).TITLE,
				};
			}
			const labs = TT.labsSection;
			const labsTimings = labs.timings;
			for (let j = 0; j < labsTimings.length; j++) {
				let timing = labsTimings[j].time;
				const array_timing = timing.split(' - ');
				let updatedTimings = [];
				let diff = eval(array_timing[1].split(':')[0] - array_timing[0].split(':')[0]);
				let first =
					timesMapping[
						array_timing[0].split(':')[0] + ':00' + ' - ' + array_timing[0].split(':')[0] + ':50'
					];
				for (let l = 0; l < diff + 1; l++) {
					updatedTimings.push(first + l);
				}

				for (let l = 0; l < updatedTimings.length; l++) {
					array2D[index][updatedTimings[l]][daysMap[labsTimings[j].dayCode]] = {
						courseCode: TT.courseCode,
						instructors: labs.instructors,
						timing: timing,
						section: labs.section,
						courseTitle: mapCourses.get(TT.courseCode).TITLE,
					};
				}
			}
		});
	});
	return array2D;
};

module.exports = generateParsedArrayForPDF;
