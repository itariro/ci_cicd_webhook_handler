const express = require("express");
const app = express();
const path = require("path");
var exphbs = require("express-handlebars");
const logger = require("./middleware/logger");
const db = require("./services/db");
const moment = require("moment");

/* Init middleware */
app.use(logger);

/* Body parser middleware */
app.use(express.json()); // body parser
app.use(express.urlencoded({ extended: false }));

/* Handlebars middleware  */
app.engine("handlebars", exphbs());
app.set("view engine", "handlebars");

/* Home page route  */
app.get("/", (req, res) => {
  res.render("index", {
    title: "scaffold CI/CD pipeline",
    description:
      "scaffold is a CI/CD tool that supports rapid software development and publishing. scaffold allows automation across your pipeline, from code building, testing to deployment. You can integrate scaffold with GitLab to create builds when new code lines are committed.",
    version: "v0.1.0",
    uptime: global.SERVER_UP_TIME,
  });
});

/* set static directory */
app.use(express.static(path.join(__dirname, "public")));

/* tasks route */
app.use("/api/v1/task", require("./routes/api/task"));

/* incidents route */
app.use("/api/v1/incident", require("./routes/api/incident"));

/* resources route - this works for all tables */
app.use("/api/v1/resource", require("./routes/api/resource"));
app.use("/api/v1/data", require("./routes/api/data"));

/* Error handler middleware */
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(err.message, err.stack);
  res.status(statusCode).json({ message: err.message });
  return;
});

/* Set port and listen */
const PORT = process.env.PORT || 1015;
app.listen(PORT, function () {
  console.log(`Server started on port ${PORT}.`);

  /* create database if we dont' already have one */
  db.createDatabase();

  /* log incident */
  db.createIncidentLog({
    description: "App Restart",
    source: "System",
    severity: "HIGH",
  });

  /* log incident */
  global.SERVER_UP_TIME = moment().format();

  /* log incident */
  db.processPendingTasks();
});
