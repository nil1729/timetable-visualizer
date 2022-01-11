const parsedData = require("./newParsed.json");
const courses = require("./courses.json");
const fs = require("fs");

const generateTimetableAPI = (preferences) => {
  let course_codes = preferences.map((course) => {
    return Object.keys(course)[0];
  });
  const timetable = new Array(5);
  let numberOfTTs = 2000;
  for (let i = 0; i < 5; i++) {
    timetable[i] = new Array(11);
  }
  let timetables = [];
  const parsedSet = new Set();
  for (let i = 0; i < courses.length; i++) {
    parsedSet.add(courses[i].COURSE_NUMBER);
  }
  class Section {
    constructor() {
      this.timings = [];
      this.instructors = [];
    }
    timings;
    instructors;
  }
  class ScheduledCourses {
    constructor() {
      this.lecturesSection = new Section();
      this.tutorialsSection = new Section();
      this.labsSection = new Section();
    }
    courseCode;
    lecturesSection;
    tutorialsSection;
    labsSection;
  }
  class Parsed {
    scheduledCourses;
  }
  class Timing {
    day;
    dayCode;
    time;
  }

  const generatePermutations = (courseDetails) => {
    let particular = [];
    if (Object.keys(courseDetails.LECTURES).length !== 0) {
      let one = [];
      for (let lecture in courseDetails.LECTURES) {
        one.push(lecture);
        if (
          Object.keys(courseDetails.TUTORIALS).length !== 0 ||
          Object.keys(courseDetails.COMMON).length !== 0
        ) {
          const tuts =
            Object.keys(courseDetails.TUTORIALS).length === 0
              ? courseDetails.COMMON
              : courseDetails.TUTORIALS;
          for (let tut in tuts) {
            one.push(tut);
            if (Object.keys(courseDetails.LABS).length !== 0) {
              for (let lab in courseDetails.LABS) {
                one.push(lab);
                particular.push([...one]);
                one.pop();
              }
            } else {
              particular.push([...one]);
            }
            one.pop();
          }
        } else if (Object.keys(courseDetails.LABS).length !== 0) {
          for (let lab in courseDetails.LABS) {
            one.push(lab);
            particular.push([...one]);
            one.pop();
          }
        } else {
          particular.push([...one]);
        }
        one.pop();
      }
    } else {
      let one = [];
      for (let lab in courseDetails.LABS) {
        one.push(lab);
        particular.push([...one]);
        one.pop();
      }
    }

    return particular;
  };

  const daysMapping = {
    M: 0,
    T: 1,
    W: 2,
    Th: 3,
    F: 4,
    S: 5,
  };

  const days = {
    M: "Monday",
    T: "Tuesday",
    W: "Wednesday",
    Th: "Thursday",
    F: "Friday",
    S: "Saturday",
  };

  const timesMapping = {
    1: "08:00 - 08:50",
    2: "09:00 - 09:50",
    3: "10:00 - 10:50",
    4: "11:00 - 11:50",
    5: "12:00 - 12:50",
    6: "13:00 - 13:50",
    7: "14:00 - 14:50",
    8: "15:00 - 15:50",
    9: "16:00 - 16:50",
    10: "17:00 - 17:50",
    11: "18:00 - 18:50",
  };

  const checkIfToBePushed = (currentTT) => {
    for (let i = 0; i < 6; i++) {
      if (currentTT[4][i] !== "" && currentTT[5][i] !== "") {
        return false;
      }
    }
    return true;
  };

  let mapCourses = new Map();

  for (let i = 0; i < parsedData.length; i++) {
    mapCourses.set(parsedData[i]["NO"], parsedData[i]);
  }

  let courseCombinations = [];
  let sum = 0;

  let indices = new Array(course_codes.length);

  let parsedTTs = new Parsed();
  parsedTTs.scheduledCourses = [];

  const generateTimetables = (
    numberOfCourses,
    courseCombinations,
    courseList,
    i,
    currentTT
  ) => {
    if (i === numberOfCourses) {
      const res = checkIfToBePushed(currentTT);

      if (res && timetables.length <= numberOfTTs - 1) {
        let newTT;
        let temp = [];
        for (let j = 0; j < numberOfCourses; j++) {
          newTT = new ScheduledCourses();
          newTT.courseCode = course_codes[j];
          let courseDetails = mapCourses.get(newTT.courseCode);
          indices[j].forEach((section) => {
            if (section[0] === "L") {
              newTT.lecturesSection.instructors =
                courseDetails.SECTIONS[section].instructors;
              newTT.lecturesSection.section = section;
              newTT.lecturesSection.dhString =
                courseDetails.SECTIONS[section].timingString;
              let timings = courseDetails.SECTIONS[section].timings;
              let timingArray = [];
              timings.forEach((e) => {
                let timeSlot = new Timing();
                timeSlot.day = days[e.day];
                timeSlot.dayCode = e.day;
                // e.dayCode = e.day;
                // e.day = days[e.day];
                let timings1 = e.timing
                  .sort((a, b) => a - b)
                  .map((e) => {
                    return timesMapping[parseInt(e)];
                  });
                timeSlot.time =
                  timings1[0].split("-")[0] +
                  "-" +
                  timings1[timings1.length - 1].split("-")[1];
                timingArray.push(timeSlot);
              });
              newTT.lecturesSection.timings = timingArray;
            } else if (section[0] === "T") {
              newTT.tutorialsSection.instructors =
                courseDetails.SECTIONS[section].instructors;
              newTT.tutorialsSection.section = section;
              newTT.tutorialsSection.dhString =
                courseDetails.SECTIONS[section].timingString;
              let timings = courseDetails.SECTIONS[section].timings;

              let timingArray = [];
              timings.forEach((e) => {
                let timeSlot = new Timing();
                timeSlot.day = days[e.day];
                timeSlot.dayCode = e.day;
                // e.dayCode = e.day;
                // e.day = days[e.day];
                let timings1 = e.timing
                  .sort((a, b) => a - b)
                  .map((e) => {
                    return timesMapping[parseInt(e)];
                  });
                timeSlot.time =
                  timings1[0].split("-")[0] +
                  "-" +
                  timings1[timings1.length - 1].split("-")[1];
                timingArray.push(timeSlot);
              });
              newTT.tutorialsSection.timings = timingArray;
            } else if (section[0] === "P") {
              newTT.labsSection.instructors =
                courseDetails.SECTIONS[section].instructors;
              newTT.labsSection.section = section;
              newTT.labsSection.dhString =
                courseDetails.SECTIONS[section].timingString;
              let timings = courseDetails.SECTIONS[section].timings;
              let timingArray = [];
              timings.forEach((e) => {
                let timeSlot = new Timing();
                timeSlot.day = days[e.day];
                timeSlot.dayCode = e.day;
                // e.dayCode = e.day;
                // e.day = days[e.day];
                let timings1 = e.timing
                  .sort((a, b) => a - b)
                  .map((e) => {
                    return timesMapping[parseInt(e)];
                  });
                timeSlot.time =
                  timings1[0].split("-")[0] +
                  "-" +
                  timings1[timings1.length - 1].split("-")[1];
                timingArray.push(timeSlot);
              });
              newTT.labsSection.timings = timingArray;
            }
          });
          temp.push(newTT);
        }
        parsedTTs.scheduledCourses.push(temp);

        timetables.push(currentTT);
      }
      return;
    }

    const currentTTCopy = new Array(11);

    for (let ij = 0; ij < 11; ij++) {
      currentTTCopy[ij] = new Array(6);

      for (let ijk = 0; ijk < 6; ijk++) {
        currentTTCopy[ij][ijk] = currentTT[ij][ijk];
      }
    }
    let execute = true;
    if (timetables.length > numberOfTTs - 1) {
      execute = false;
    }
    const courseDetails = mapCourses.get(course_codes[i]);
    for (let j = 0; j < courseCombinations[i].length && execute; j++) {
      indices[i] = courseCombinations[i][j];
      let toBeAdded = true;
      let combination = courseCombinations[i][j];
      // let newSectionsEnabled = true;
      // for (let o = 0; o < combination.length; o++) {
      //   if (combination[o][combination[o].length - 1] !== "N") {
      //     newSectionsEnabled = false;
      //     toBeAdded = false;
      //   }
      // }
      // if (newSectionsEnabled) {
      for (let k = 0; k < combination.length && toBeAdded; k++) {
        let section = courseCombinations[i][j][k];
        if (
          section[0] === "L" ||
          section[0] === "T" ||
          section[0] === "P"
          // section[section.length - 1] === "N"
        ) {
          let sectionDetails =
            section[0] === "L"
              ? courseDetails.LECTURES[section]
              : section[0] === "T"
              ? courseDetails.TUTORIALS[section]
              : courseDetails.LABS[section];
          let timings = sectionDetails.timings;
          for (let l = 0; l < timings.length && toBeAdded; l++) {
            let clash = false;
            for (let m = 0; m < timings[l].timing.length; m++) {
              if (
                currentTT[parseInt(timings[l].timing[m]) - 1][
                  daysMapping[timings[l].day]
                ] !== ""
              ) {
                clash = true;
                break;
              }
            }
            if (!clash) {
              for (let m = 0; m < timings[l].timing.length; m++) {
                currentTT[timings[l].timing[m] - 1][
                  daysMapping[timings[l].day]
                ] = course_codes[i] + " " + section;
              }
            } else {
              toBeAdded = false;
            }
          }
        }
      }

      if (toBeAdded) {
        generateTimetables(
          numberOfCourses,
          courseCombinations,
          courseList,
          i + 1,
          currentTT
        );
      }

      currentTT = new Array(11);

      for (let ij = 0; ij < 11; ij++) {
        currentTT[ij] = new Array(6);
        for (let ijk = 0; ijk < 6; ijk++) {
          currentTT[ij][ijk] = currentTTCopy[ij][ijk];
        }
      }
    }
  };

  let fail = false;

  for (let i = 0; i < course_codes.length; i++) {
    if (!parsedSet.has(course_codes[i])) {
      console.log("Invalid course/courses entered");
      fail = true;
      break;
    } else {
      const courseDetails = mapCourses.get(course_codes[i]);
      const coursePreferences = preferences[i];
      let updatedCourseDetails = { ...courseDetails };
      updatedCourseDetails.LECTURES = Object.keys(updatedCourseDetails.LECTURES)
        .filter((key) => {
          if (preferences[i][course_codes[i]].PREFERRED.LECTURES.length > 0) {
            return (
              preferences[i][course_codes[i]].PREFERRED.LECTURES.indexOf(key) >=
              0
            );
          }

          return (
            preferences[i][course_codes[i]].UNPREFERRED.LECTURES.indexOf(key) <
            0
          );
        })
        .reduce((obj, key) => {
          obj[key] = updatedCourseDetails.LECTURES[key];
          return obj;
        }, {});
      updatedCourseDetails.TUTORIALS = Object.keys(
        updatedCourseDetails.TUTORIALS
      )
        .filter((key) => {
          if (preferences[i][course_codes[i]].PREFERRED.TUTORIALS.length > 0) {
            return (
              preferences[i][course_codes[i]].PREFERRED.TUTORIALS.indexOf(
                key
              ) >= 0
            );
          }

          return (
            preferences[i][course_codes[i]].UNPREFERRED.TUTORIALS.indexOf(key) <
            0
          );
        })
        .reduce((obj, key) => {
          obj[key] = updatedCourseDetails.TUTORIALS[key];
          return obj;
        }, {});
      updatedCourseDetails.LABS = Object.keys(updatedCourseDetails.LABS)
        .filter((key) => {
          if (preferences[i][course_codes[i]].PREFERRED.LABS.length > 0) {
            return (
              preferences[i][course_codes[i]].PREFERRED.LABS.indexOf(key) >= 0
            );
          }

          return (
            preferences[i][course_codes[i]].UNPREFERRED.LABS.indexOf(key) < 0
          );
        })
        .reduce((obj, key) => {
          obj[key] = updatedCourseDetails.LABS[key];
          return obj;
        }, {});
      if (
        (Object.keys(courseDetails.LECTURES).length > 0 &&
          Object.keys(updatedCourseDetails.LECTURES).length === 0) ||
        (Object.keys(courseDetails.TUTORIALS).length > 0 &&
          Object.keys(updatedCourseDetails.TUTORIALS).length === 0) ||
        (Object.keys(courseDetails.LABS).length > 0 &&
          Object.keys(updatedCourseDetails.LABS).length === 0)
      ) {
        fail = true;
      }
      updatedCourseDetails.SECTIONS = {
        ...updatedCourseDetails.LECTURES,
        ...updatedCourseDetails.TUTORIALS,
        ...updatedCourseDetails.LABS,
      };
      const combinations = generatePermutations(updatedCourseDetails);

      courseCombinations.push(combinations);
    }
  }
  if (!fail) {
    const numberOfCourses = course_codes.length;
    let TT = new Array(11);
    for (let i = 0; i < TT.length; i++) {
      TT[i] = new Array(6);
      for (let j = 0; j < 6; j++) {
        TT[i][j] = "";
      }
    }
    generateTimetables(
      numberOfCourses,
      courseCombinations,
      course_codes,
      0,
      TT
    );
  } else {
    parsedTTs = new Parsed();
    parsedTTs.scheduledCourses = [];
  }
  return parsedTTs;
};
// generateTimetableAPI([
//   {
//     "CS F212": {
//       PREFERRED: { LECTURES: [], TUTORIALS: [], LABS: [] },
//       UNPREFERRED: { LECTURES: ["L1"], TUTORIALS: [], LABS: [] },
//     },
//   },
//   {
//     "CS F241": {
//       PREFERRED: { LECTURES: [], TUTORIALS: [], LABS: [] },
//       UNPREFERRED: { LECTURES: [], TUTORIALS: [], LABS: [] },
//     },
//   },
//   {
//     "ECON F315": {
//       PREFERRED: { LECTURES: [], TUTORIALS: [], LABS: [] },
//       UNPREFERRED: { LECTURES: [], TUTORIALS: [], LABS: [] },
//     },
//   },
//   {
//     "ECON F341": {
//       PREFERRED: { LECTURES: [], TUTORIALS: [], LABS: [] },
//       UNPREFERRED: { LECTURES: [], TUTORIALS: [], LABS: [] },
//     },
//   },
//   {
//     "ECON F342": {
//       PREFERRED: { LECTURES: [], TUTORIALS: [], LABS: [] },
//       UNPREFERRED: { LECTURES: [], TUTORIALS: [], LABS: [] },
//     },
//   },
//   {
//     "ECON F343": {
//       PREFERRED: { LECTURES: [], TUTORIALS: [], LABS: [] },
//       UNPREFERRED: { LECTURES: [], TUTORIALS: [], LABS: [] },
//     },
//   },
//   {
//     "CS F211": {
//       PREFERRED: { LECTURES: [], TUTORIALS: [], LABS: [] },
//       UNPREFERRED: { LECTURES: [], TUTORIALS: [], LABS: [] },
//     },
//   },
// ]);

module.exports = generateTimetableAPI;
