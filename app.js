require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const { engine } = require("express-handlebars");
const logger = require("./middleware/logger");
const db = require("./services/db");
const moment = require("moment");
const { listenForMessages } = require("./services/rabbitmq");
const { processPendingTasks, manageQueuedTasks, processPendingBroadcastTasks } = require("./services/task_manager");
const appConfigs = require("./services/api_config").getAPIConfig();
const sequelizeInstance = db.dbConnectionSequelize();

/* Init middleware */
app.use(logger);

/* Body parser middleware */
app.use(express.json()); // body parser
app.use(express.urlencoded({ extended: false }));

/* Handlebars middleware  */
app.engine("handlebars", engine({ extname: ".hbs", defaultLayout: "main" }));
app.set("view engine", "handlebars");
app.set("views", "./views");

/* Home page route  */
app.get("/", (req, res) => {
  res.render("index", {
    title: "Kuchando Auto Task Worker",
    description: "Kuchando Auto Task Worker node for distributed systems",
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
const PORT = process.env.PORT || 3003;
app.listen(PORT, function () {
  try {
    console.log(`Server started on port ${PORT}.`);
    appConfigs
      .then(async function (apiConfigs) {
        global.API_CONFIGS = apiConfigs;
        global.API_KEY = apiConfigs[0].apiKey;
        /* create database if we dont' already have one */
        const dbCreateResult = await db.createDatabase();
        if (!dbCreateResult.error) {
          /* start cron job for all tasks in task queue */
          var CronJob = require("cron").CronJob;
          global.PENDING_TASKS_CRON_JOB = new CronJob(
            "* * * * * *",
            function () {
              // console.log("pending tasks");
			  processPendingTasks();
			},
            null,
            false,
            "Europe/London"
          );
		  
		  global.QUEUED_TASKS_CRON_JOB = new CronJob(
            "* * * * * *",
            function () {
              console.log("queued tasks");
			  processPendingBroadcastTasks();
            },
            null,
            false,
            "Europe/London"
          );
          // Use this if the 4th param is default value(false)
          // job.start();
		  global.PENDING_TASKS_CRON_JOB.start();
		  global.QUEUED_TASKS_CRON_JOB.stop();
        }

        /* log incident */
        db.createIncidentLog({
          description: "App Restart",
          source: "System",
          severity: "HIGH",
        });
      })
      .catch(function (err) {
        console.log(err);
      });

    /* log incident */
    global.SERVER_UP_TIME = moment().format();

    /* start listening for messages on queue */
    listenForMessages();
  } catch (error) {
    console.log("Could not start server due to : ", error);
  }
});
