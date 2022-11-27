const path = require('path');
const configFilePath = path.join('/opt/nil1729/timetable-visualizer/backend.env');
require('dotenv').config({ path: configFilePath });

const express = require('express');
const DeviceDetector = require('node-device-detector');
const DeviceHelper = require('node-device-detector/helper');
const app = express();
const PORT = process.env.PORT || 5050;
const connectDB = require('./config/db');
const courseRoutes = require('./src/routes/courses');
const timetableRoutes = require('./src/routes/timetable');
const morgan = require('morgan');

// create middleware
const middlewareDetect = (req, res, next) => {
  const detector = new DeviceDetector();
  const userAgent = req.headers['user-agent'];
  const result = detector.detect(userAgent);
  const { client } = result;
  req.deviceInfo = result;

  if (client.type === 'browser') next();
  else res.status(403).end();
};

app.use(express.json());
app.use(morgan('combined'));
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/timetable', timetableRoutes);
app.use('/api/v1/feedback', require('./src/routes/feedback'));
app.use('/api/v1/pdf', require('./src/routes/pdf-generate'));

app.use(express.static(__dirname + '/prod'));
if (process.env.NODE_ENV === 'production') {
  app.get('*', middlewareDetect, async (req, res) => {
    if (DeviceHelper.isDesktop(req.deviceInfo)) {
      res.sendFile(__dirname + '/prod/desktop/index.html');
    } else {
      res.sendFile(__dirname + '/frontend-mobile/index.html');
    }
  });
}

app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server started on port ${PORT}`);
});
