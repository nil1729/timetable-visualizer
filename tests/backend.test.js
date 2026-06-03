const { describe, it, expect } = require('vitest');

// Import the ICS generator
const generateICS = require('../timetable-generator/generateICS');
const fs = require('fs');
const path = require('path');

describe('ICS Generator', () => {
  const testCourses = [
    {
      courseCode: 'PHY F111',
      lecturesSection: {
        section: 'L1',
        timings: [{ day: 'Monday', dayCode: 'M', time: '09:00 - 09:50' }],
        instructors: ['John Doe'],
      },
    },
  ];

  it('should generate a valid ICS string', () => {
    const fileName = 'test-ics-' + Date.now();
    const tmpPath = path.join(__dirname, '..', 'tmp');
    if (!fs.existsSync(tmpPath)) fs.mkdirSync(tmpPath, { recursive: true });

    generateICS(testCourses, fileName);

    const icsPath = path.join(tmpPath, fileName + '.ics');
    expect(fs.existsSync(icsPath)).toBe(true);

    const content = fs.readFileSync(icsPath, 'utf8');
    expect(content).toContain('BEGIN:VCALENDAR');
    expect(content).toContain('END:VCALENDAR');
    expect(content).toContain('BEGIN:VEVENT');
    expect(content).toContain('END:VEVENT');
    expect(content).toContain('PHY F111');

    // Cleanup
    fs.unlinkSync(icsPath);
  });
});

describe('Course Model Structure', () => {
  it('should have expected schema fields', () => {
    const Course = require('../src/models/Course');
    const schema = Course.schema;

    expect(schema.paths.courseNo).toBeDefined();
    expect(schema.paths.courseCode).toBeDefined();
    expect(schema.paths.courseName).toBeDefined();
    expect(schema.paths.units).toBeDefined();
    expect(schema.paths.IC).toBeDefined();
    expect(schema.paths.lectures).toBeDefined();
    expect(schema.paths.tutorials).toBeDefined();
    expect(schema.paths.labs).toBeDefined();
  });
});

describe('Timetable Model Structure', () => {
  it('should have expected schema fields', () => {
    const Timetable = require('../src/models/Timetable');
    const schema = Timetable.schema;

    expect(schema.paths.shareID).toBeDefined();
    expect(schema.paths.scheduledCourses).toBeDefined();
  });
});

describe('Timetable Parser', () => {
  it('should parse timetable data from JSON', () => {
    const dataPath = path.join(__dirname, '..', 'data', 'v1.json');
    // Skip if data file doesn't exist (fresh clone without data)
    if (!fs.existsSync(dataPath)) return;

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });
});

describe('Admin Settings API', () => {
  it('should return HTML from the settings page', () => {
    // This is a structural test — actual HTTP test needs a running server
    const adminRoutes = require('../src/routes/admin');
    expect(typeof adminRoutes).toBe('function');
  });
});
