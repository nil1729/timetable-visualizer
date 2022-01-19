const fs = require("fs");
const courses = require("./courses.json");
const uuid = require("uuid");
const path = require("path");
// const scheduledCourses = require("./data.json").scheduledCourses[0];

const generateICS = (scheduledCourses, filename) => {
  const semStart = new Date(2022, 0, 17);
  const semEnd = new Date(2022, 4, 10);
  let strResult = "";

  const courseMap = new Map();
  const roomMap = new Map();

  for (let i = 0; i < courses.length; i++) {
    roomMap.set(courses[i].COURSE_NUMBER, courses[i].ROOM);
  }

  for (let i = 0; i < courses.length; i++) {
    courseMap.set(courses[i].COURSE_NUMBER, courses[i].COURSE_TITLE);
  }

  const generateICS = (scheduledCourses) => {
    strResult += "BEGIN:VCALENDAR\n";
    strResult += "PRODID:-//Google Inc//Google Calendar 70.9054//EN\n";
    strResult += "VERSION:2.0\n";
    strResult += "METHOD:PUBLISH\n";
    scheduledCourses.forEach((course) => {
      const lectures = course.lecturesSection;
      if (typeof lectures !== "undefined") {
        strResult = common(
          lectures.timings,
          strResult,
          course,
          lectures.section,
          lectures.instructors
        );
      }

      const tuts = course.tutorialsSection;
      if (typeof tuts !== "undefined") {
        strResult = common(
          tuts.timings,
          strResult,
          course,
          tuts.section,
          tuts.instructors
        );
      }
      const labs = course.labsSection;
      if (typeof labs !== "undefined") {
        strResult = common(
          labs.timings,
          strResult,
          course,
          labs.section,
          labs.instructors
        );
      }
    });
  };
  generateICS(scheduledCourses);
  strResult += "END:VCALENDAR";
  fs.writeFileSync(path.join(__dirname, `../tmp/${filename}.ics`), strResult);

  function generateDescription(instructors) {
    let description = "";
    instructors.forEach((instructor) => {
      description += `<p>${instructor}</p>`;
    });
    return description;
  }

  function getFirstDate(start, dayName) {
    var result = [];
    var days = { su: 0, m: 1, t: 2, w: 3, th: 4, f: 5, s: 6 };
    var day = days[dayName.toLowerCase().substr(0, 3)];
    var current = new Date(start);
    current.setDate(current.getDate() + ((day - current.getDay() + 7) % 7));
    result.push(new Date(+current));
    return result;
  }

  function common(timings, strResult, course, section, instructors) {
    timings.forEach((time) => {
      const dates = getFirstDate(semStart, time.dayCode);
      let date = dates[0];
      let updatedDate = date.toISOString().split("-").join("");

      let startTime = updatedDate
        .split("T")[0]
        .concat("T" + time.time.split(" - ")[0] + "00Z")
        .split(":")
        .join("");
      let endTime = updatedDate
        .split("T")[0]
        .concat("T" + time.time.split(" - ")[1] + "00Z")
        .split(":")
        .join("");
      strResult += "BEGIN:VEVENT\n";
      strResult += "DTSTART" + ";TZID=Asia/Kolkata:" + startTime + "\n";
      strResult += "DTEND" + ";TZID=Asia/Kolkata:" + endTime + "\n";
      strResult +=
        "RRULE:FREQ=WEEKLY;UNTIL=" +
        semEnd
          .toISOString()
          .split("-")
          .join("")
          .split(":")
          .join("")
          .split(".")[0] +
        "Z" +
        "\n";
      strResult +=
        "DTSTAMP:" +
        new Date()
          .toISOString()
          .split(".")[0]
          .split(":")
          .join("")
          .split("-")
          .join("") +
        "Z" +
        "\n";
      strResult +=
        "SUMMARY:" +
        course.courseCode +
        ": " +
        courseMap.get(course.courseCode) +
        " - " +
        section +
        " " +
        (roomMap.get(course.courseCode).length === 0
          ? ""
          : `(Room: ${roomMap.get(course.courseCode)})`) +
        "\n";
      strResult += "UID:" + uuid.v4() + "\n";
      strResult += "DESCRIPTION:" + generateDescription(instructors) + "\n";
      strResult += "X-GOOGLE-CONFERENCE:\n";
      strResult += "END:VEVENT" + "\n";
    });
    return strResult;
  }
};

module.exports = generateICS;
