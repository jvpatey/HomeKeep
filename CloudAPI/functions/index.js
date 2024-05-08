const {onRequest} = require("firebase-functions/v2/https");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const notificationapi = require('notificationapi-node-server-sdk').default

admin.initializeApp();

const getEmailFromUserId = (userData, userId) => {
    // Check if the 'users' array exists in the userData object
    if (userData && userData.users && Array.isArray(userData.users)) {
        // Find the user record with the matching UID
        const userRecord = userData.users.find(user => user.uid === userId);

        // If the user record is found, return the email
        if (userRecord) {
            return userRecord.email;
        } else {
            // If the user record is not found, return null or throw an error
            return null;
            // Alternatively, you can throw an error if the user record is not found
            // throw new Error('User not found');
        }
    } else {
        // Handle case where userData object or users array is missing
        throw new Error('Invalid userData object');
    }
}

function parseDate(dateStr) {
	const [month, day, year] = dateStr.split('-').map(Number);
	// Months are zero-based in JavaScript Date objects, so subtract 1 from month
	return new Date(year, month - 1, day);
}

function datesAreEqual(date1, date2) {
	return (
		date1.getDate() === date2.getDate() &&
		date1.getMonth() === date2.getMonth() &&
		date1.getFullYear() === date2.getFullYear()
	);
}

exports.notifyOnSchedule = onSchedule("every day 11:00", async (event) => {
	try {
		const db = admin.firestore();
		const snapshot = await db.collection('users').get();
		const snapshot2 = await admin.auth().listUsers()
		var docs = []

		snapshot.forEach(async doc => {
			const userEmail = getEmailFromUserId(snapshot2, doc.id);
			const tasksSnapshot = await db.collection('users').doc(doc.id).collection('tasks').get();
			const tasks = tasksSnapshot.docs.map(taskDoc => taskDoc.data());
			const userDataWithTasks = { email: userEmail, tasks: tasks };
			const currentDate = new Date();

			tasks.forEach((task) => {
				// Parse start date and end date
				console.log("---TASK---");
				console.log(task.taskTitle);
				console.log(task.startDate);
				const startDate = parseDate(task.startDate);
				console.log(startDate);
				//const endDate = parseDate(task.endDate);
				
				var shouldSend = false;
				// Check if today falls on the start date or an interval day
				console.log(datesAreEqual(currentDate, startDate));
				if (datesAreEqual(currentDate, startDate)) {
					console.log("Today falls on the start date.");
					shouldSend = true;
				} else {
					// Calculate interval in milliseconds
					const interval = parseInt(task.interval) * 24 * 60 * 60 * 1000; // Convert days to milliseconds
					
					// Initialize variable to track if today falls on an interval day
					let todayOnIntervalDay = false;
					
					// Loop through dates starting from the start date until today's date
					for (let date = new Date(startDate); date <= currentDate; date.setTime(date.getTime() + interval)) {
						// Check if today falls on the current loop date
						if (datesAreEqual(currentDate, date)) {
							todayOnIntervalDay = true;
							break; // Exit loop if today falls on an interval day
						}
					}
					
					// Check if today falls on an interval day
					if (todayOnIntervalDay) {
						console.log("Today falls on an interval day.");
						shouldSend = true;
					} else {
						console.log("Today does not fall on an interval day.");
					}
				}

				if (shouldSend) {
					sendNotification(doc.id, userEmail, task);
				}
			});

			docs.push(tasks);
			// docs.push(userDataWithTasks);
		});
	
		response.send(docs);
	} catch (error) {
		console.error('Error reading Firestore:', error);
		response.send("Error from firebase");
	}
});

function sendNotification(userId, userEmail, task) {
	notificationapi.init('', '');

	notificationapi.send({
		notificationId: 'x',
		user: {
			id: userId,
			email: userEmail 
		},
		mergeTags: {
			title: task.taskName,
			category: task.category
		},
	});
};

// exports.notify = onRequest((request, response) => {
// 	notificationapi.init('', '');

// 	const schedule = request.query.schedule;

// 	const trackingIdPromise = notificationapi.send({
// 		notificationId: 'x',
// 		user: {
// 			id: 'allan.lavell',
// 			email: 'alavell@gmail.com'
// 		},
// 		mergeTags: {
// 			item: 'Krabby Patty Burger',
// 			address: '124 Conch Street',
// 			orderId: '1234567890'
// 		},
// 		schedule: schedule
// 	});

// 	trackingIdPromise.then((value) => {
// 		console.log(value.data.trackingId);
// 	})
// });
