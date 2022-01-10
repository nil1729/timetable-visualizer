const courses = [];
const timetable = require("./Timetable.json");
const fs = require("fs");

timetable.forEach((element) => {
  if (
    element["COURSE TITLE"] !== "" &&
    element["COURSE TITLE"] !== "Practical" &&
    element["COURSE TITLE"] !== "Tutorial"
  ) {
    courses.push({
      COURSE_TITLE: element["COURSE TITLE"],
      COURSE_NUMBER: element["COURSE NO."],
    });
  }
});

fs.writeFile(__dirname + "/courses.json", JSON.stringify(courses), (err) => {
  if (err) {
    console.log(err);
  }
});

class ParsedDataObj {
  constructor(
    COM_COD,
    NO,
    TITLE,
    L,
    P,
    U,
    COMPRE,
    LECTURES,
    TUTORIALS,
    LABS,
    SECTIONS,
    COMMON
  ) {
    this.COM_COD = COM_COD;
    this.NO = NO;
    this.L = L;
    this.TITLE = TITLE;
    this.P = P;
    this.U = U;
    this.COMPRE = COMPRE;
    this.LECTURES = LECTURES;
    this.TUTORIALS = TUTORIALS;
    this.LABS = LABS;
    this.SECTIONS = SECTIONS;
    this.COMMON = COMMON;
  }
}

// console.log(process.argv);
const parsedSet = new Set();

for (let i = 0; i < courses.length; i++) {
  parsedSet.add(courses[i].COURSE_NUMBER);
}

const someMoreParsing = [];

const commonFunc = (curSection, timetable, i, type, type1) => {
  type[curSection] = {};
  type[curSection].instructors = [];
  type[curSection].instructors.push(
    timetable[i]["INSTRUCTOR-IN-CHARGE/Instructor"]
  );
  type[curSection].timingString = timetable[i]["DAYS AND HOURS"];
  type1[curSection] = {};
  type1[curSection].instructors = [];
  type1[curSection].instructors.push(
    timetable[i]["INSTRUCTOR-IN-CHARGE/Instructor"]
  );
  type1[curSection].timingString = timetable[i]["DAYS AND HOURS"];

  const timings = timetable[i]["DAYS AND HOURS"].split(" ").filter((e) => {
    if (e.trim().length !== 0) {
      return e;
    }
  });
  let daysAndTimeArray = [];
  let toBePushed = [];
  if (curSection[0] === "L" || curSection[0] === "T") {
    for (let i = 0; i < timings.length; i++) {
      if (isNaN(timings[i])) {
        daysAndTimeArray.push(timings[i]);
      } else {
        while (daysAndTimeArray.length > 0) {
          const current = daysAndTimeArray.pop();
          toBePushed.push({
            day: current,
            timing: timings[i].split(),
          });
        }
      }
    }
    type[curSection].timings = toBePushed;
    type1[curSection].timings = toBePushed;
  } else {
    for (let i = timings.length - 1; i >= 0; i--) {
      if (!isNaN(timings[i])) {
        daysAndTimeArray.push(timings[i]);
      } else {
        toBePushed.push({
          day: timings[i],
          timing: daysAndTimeArray,
        });
      }
      type[curSection].timings = toBePushed;
      type1[curSection].timings = toBePushed;
    }
    // type[curSection].timings = [
    //   {
    //     day: timings[0],
    //     timing: timings.slice(1, 3),
    //   },
    // ];
    // type1[curSection].timings = [
    //   {
    //     day: timings[0],
    //     timing: timings.slice(1, 3),
    //   },
    // ];
  }

  i++;
  while (i < timetable.length && timetable[i].SEC === "") {
    type[curSection].instructors.push(
      timetable[i]["INSTRUCTOR-IN-CHARGE/Instructor"]
    );
    type1[curSection].instructors.push(
      timetable[i]["INSTRUCTOR-IN-CHARGE/Instructor"]
    );
    i++;
  }
  while (i < timetable.length && timetable[i]["COURSE NO."] === "") {
    if (timetable[i].SEC[0] !== "" && timetable[i].SEC[0] !== curSection[0]) {
      return i;
    }
    const curSec = timetable[i].SEC;

    type[curSec] = {};
    type[curSec].instructors = [];
    type[curSec].instructors.push(
      timetable[i]["INSTRUCTOR-IN-CHARGE/Instructor"]
    );
    type[curSec].timingString = timetable[i]["DAYS AND HOURS"];
    type1[curSec] = {};
    type1[curSec].instructors = [];
    type1[curSec].instructors.push(
      timetable[i]["INSTRUCTOR-IN-CHARGE/Instructor"]
    );
    type1[curSec].timingString = timetable[i]["DAYS AND HOURS"];
    const timings = timetable[i]["DAYS AND HOURS"].split(" ").filter((e) => {
      if (e.trim().length !== 0) {
        return e;
      }
    });
    if (curSec[0] === "L" || curSec[0] === "T") {
      let daysAndTimeArray = [];
      let toBePushed = [];
      for (let i = 0; i < timings.length; i++) {
        if (isNaN(timings[i])) {
          daysAndTimeArray.push(timings[i]);
        } else {
          while (daysAndTimeArray.length > 0) {
            const current = daysAndTimeArray.pop();
            toBePushed.push({
              day: current,
              timing: timings[i].split(),
            });
          }
        }
      }
      type[curSec].timings = toBePushed;
      type1[curSec].timings = toBePushed;
    } else {
      daysAndTimeArray = [];
      toBePushed = [];
      for (let i = timings.length - 1; i >= 0; i--) {
        if (!isNaN(timings[i])) {
          daysAndTimeArray.push(timings[i]);
        } else {
          toBePushed.push({
            day: timings[i],
            timing: daysAndTimeArray,
          });
        }
        type[curSec].timings = toBePushed;
        type1[curSec].timings = toBePushed;
      }
    }
    i++;
    while (i < timetable.length && timetable[i].SEC === "") {
      type[curSec].instructors.push(
        timetable[i]["INSTRUCTOR-IN-CHARGE/Instructor"]
      );
      type1[curSec].instructors.push(
        timetable[i]["INSTRUCTOR-IN-CHARGE/Instructor"]
      );
      i++;
    }
  }
  return i;
};

for (let i = 0; i < timetable.length; i++) {
  const lectures = {};
  const tutorials = {};
  const labs = {};
  const common = {};
  const myObj = {};
  const objForCourse = new ParsedDataObj(
    timetable[i]["COM COD"],
    timetable[i]["COURSE NO."],
    timetable[i]["COURSE TITLE"],
    timetable[i]["L"],
    timetable[i]["P"],
    timetable[i]["U"],
    timetable[i]["COMPRE DATE"],
    lectures,
    tutorials,
    labs,
    myObj,
    common
  );
  let curSection = timetable[i]["SEC"];

  let temp;
  if (
    curSection[0] === "L" &&
    (timetable[i]["COURSE NO."] === objForCourse.NO ||
      timetable[i]["COURSE NO."] === "")
  ) {
    temp = commonFunc(curSection, timetable, i, lectures, myObj);
    i = temp;
    if (i >= timetable.length) {
      someMoreParsing.push(objForCourse);
      break;
    }
    curSection = timetable[i]["SEC"];
  }
  if (
    curSection[0] === "T" &&
    (timetable[i]["COURSE NO."] === objForCourse.NO ||
      timetable[i]["COURSE NO."] === "")
  ) {
    temp = commonFunc(curSection, timetable, i, tutorials, myObj);
    i = temp;
    if (i >= timetable.length) {
      someMoreParsing.push(objForCourse);
      break;
    }
    curSection = timetable[i]["SEC"];
  }

  if (
    curSection[0] === "P" &&
    (timetable[i]["COURSE NO."] === objForCourse.NO ||
      timetable[i]["COURSE NO."] === "")
  ) {
    temp = commonFunc(curSection, timetable, i, labs, myObj);
    i = temp;
    if (i >= timetable.length) {
      someMoreParsing.push(objForCourse);
      break;
    }
    curSection = timetable[i]["SEC"];
  }
  let inside = false;
  if (curSection[0] === "C" && timetable[i]["COURSE NO."] === objForCourse.NO) {
    temp = commonFunc(curSection, timetable, i, common, myObj);
    i = temp;
    if (i >= timetable.length) {
      someMoreParsing.push(objForCourse);
      break;
    }
    curSection = timetable[i]["SEC"];
  }
  someMoreParsing.push(objForCourse);
  i--;
}
// update the newParsed file by uncommenting the following lines
fs.writeFile(
  __dirname + "/newParsed.json",
  JSON.stringify(someMoreParsing),
  (err) => {
    if (err) {
      console.log(err);
    }
  }
);

// for (let i = 2; i < process.argv.length; i++) {
//   if (!parsedSet.has(process.argv[i])) {
//     console.log("Invalid course/courses entered");
//     break;
//   }
// }
