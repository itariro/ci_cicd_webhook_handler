const db = require("./db");
const { Op } = require("sequelize");
const { scrapOnBeforward } = require("./search_app");
let currentQueue = [];

async function processPendingBroadcastTasks() {
  try {
    let tableModel = global.CURRENT_MODELS.find(
      (tableProperties) => tableProperties.table_name === "result_cast"
    );
    if (tableModel != null) {
      const pendingTasks = await tableModel.model_name.findAll({
        where: {
          [Op.and]: [{ attempts: [0, 1, 2] }, { status: 0 }],
        },
      });
      // process the outstanding TASKS HERE
      console.log("pendingTasks -> ", pendingTasks);
    } else {
      console.log("resource does not exist");
    }
  } catch (error) {
    console.log(error);
  }

  // let sql = `SELECT uuid, user, payload FROM task_result_cast WHERE status = 'pending' AND attempts < 3 ORDER BY id`;
  // let db = dbConnection();
  // db.all(sql, [], (err, rows) => {
  // 	if (err) {
  // 		throw err.message;
  // 		return false;
  // 	}

  // 	if (rows.length > 0) {
  // 		rows.forEach(async (task) => {
  // 			console.log("task => ", task);
  // 			sendInteractiveMessage(task.uuid, task.user, JSON.parse(task.payload));
  // 		});
  // 		return true;
  // 	}
  // });

  // console.log("done -> test()");
  // db.close();
  // setTimeout(processPendingTasks, 300000); // 10 second intervals
}

async function processPendingTasks() {
  try {
    const pendingTasks = await getAllPendingTasks();
    if (!pendingTasks.error) {
      pendingTasks.data.map((task) => {
        console.log("task -> ", task.dataValues.id);
        // check if task is currently in processing queue, if not, add it
        if (
          currentQueue.find(
            (taskProperties) => taskProperties.id === task.dataValues.id
          ) === null
        ) {
			currentQueue.push(task.dataValues);
        }
      });
    }
  } catch (error) {
    console.log(error);
  }
}

const manageQueuedTasks = async () => {
  await Promise.allSettled(
    currentQueue.map(async (task, index) => {
      try {
        // search on BF
		await scrapOnBeforward(task)
		console.error(`I'm down, this time. ${err}`);
		
		// remove from list
		currentQueue = currentQueue.slice(0,indexForRemoval).concat(currentQueue.slice(index+1))
      } catch (err) {
        console.error(`I'm down, this time. ${err}`);
      }
    })
  );
};

async function getAllPendingTasks() {
  try {
    let tableModel = global.CURRENT_MODELS.find(
      (tableProperties) => tableProperties.table_name === "task"
    );
    if (tableModel != null) {
      const pendingTasks = await tableModel.model_name.findAll({
        where: {
          [Op.and]: [{ attempts: [0, 1, 2] }, { status: 0 }],
        },
      });
      // process the outstanding TASKS HERE
      return {
        error: false,
        data: pendingTasks,
      };
    } else {
      console.log("resource does not exist");
      return {
        error: true,
        message: "resource does not exist",
      };
    }
  } catch (error) {
    console.log(error);
    return {
      error: true,
      message: error,
    };
  }
}

async function loadContent() {
  const posts = await getBlogPosts();

  // instead of awaiting this call, create an array of Promises
  const promises = posts.map((post) => {
    return getBlogComments(post.id).then((comments) => {
      return { ...post, comments };
    });
  });

  // use await on Promise.all so the Promises execute in parallel
  const postsWithComments = await Promise.all(promises);

  console.log(postsWithComments);
}

/* ---------- INCIDENT LOGS ---------- */
async function createIncidentLog(incidentLog) {
  /* create new single log entry */

  let db = dbConnection();
  db.run(
    `INSERT INTO incident (date, description, source, severity) VALUES(?,?,?,?)`,
    [
      moment().format(),
      incidentLog.description,
      incidentLog.source,
      incidentLog.severity,
    ],
    function (err) {
      if (err) {
        return {
          error: true,
          message: err.message,
        };
      }
      return {
        error: false,
        data: this.lastID,
      };
    }
  );
  db.close();
}

/* ---------- AUXILARY FUNCTIONS ---------- */

const searchInArray = (haystack, criteria, needle) => {
  return haystack.filter((hay) => {
    return criteria.some(
      (newItem) =>
        hay[newItem].toString().toLowerCase().indexOf(needle.toLowerCase()) > -1
    );
  });
};

module.exports = {
  processPendingBroadcastTasks,
  processPendingTasks,
  createIncidentLog,
  manageQueuedTasks
};
