/* ------ Firebase Initialization  ------ */

// Import Firebase, Firestore, Auth
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js'
import { getFirestore, doc, collection, getDoc, addDoc, getDocs, deleteDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js'
import { getAuth, signOut } from 'https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js';

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyCrQCy3XJHfkusqmoXafsCqjAcZJWInx7s",
    authDomain: "homekeep-x.firebaseapp.com",
    projectId: "homekeep-x",
    storageBucket: "homekeep-x.appspot.com",
    messagingSenderId: "142689184811",
    appId: "1:142689184811:web:61e53ac8ec053c68bc0e6e"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

// Check authentication status
console.log(auth.currentUser);

// Handle authentication state changes
auth.onAuthStateChanged(user => {
    if (user) {
        console.log("User is logged in:", user);
        renderCalendar(user);
    } else {
        console.log("No user logged in.");
    }
});

/* ------ Handling FireStore Task Data with Calendar ------ */

/// function to save add task data
async function saveFormData(user) {
    var taskName = document.getElementById('taskName').value;
    var category = document.getElementById('category').value;
    var startDate = document.getElementById('startDate').value;
    var interval = document.getElementById('interval').value.trim();
    var description = document.getElementById('description').value;

    // Validate interval field
    var intervalRegex = /^\d+$/;
    if (!intervalRegex.test(interval)) {
        alert("Interval must be a positive integer.");
        return;
    }

    // Parse interval to integer
    interval = parseInt(interval);

    if (interval < 0 || interval > 365) {
        alert("Interval must be between 0 and 365.");
        return;
    }

    // Add the task to Firestore
    await addTaskToFirestore(user, startDate, taskName, category, description, interval);

    // Reset the form after successful submission
    document.getElementById('addTaskForm').reset();
    document.getElementById('addTaskModal').close();
    displayTasks(user);
}

// function to add task data to Firestore
async function addTaskToFirestore(user, startDate, taskName, category, description, interval) {
    try {
        // Add the task to Firestore under the user's ID
        await addDoc(collection(firestore, `users/${user.uid}/tasks`), {
            taskName: taskName,
            category: category,
            startDate: startDate,
            interval: interval,
            description: description
        });
        console.log("Document successfully written!");
    } catch (error) {
        console.error("Error writing document: ", error);
    }
}

async function addTasksWithIntervalToFirestore(startDate, taskName, category, description, interval) {
    
    try {
        const MAX_OCCURRENCES = 10;

        // Take month, day, and year from the start date
        var [startMonth, startDay, startYear] = startDate.split('-').map(Number);
        var start = new Date(startYear, startMonth - 1, startDay);

        // Add the initial task to Firestore
        await addDoc(collection(firestore, "tasks"), {
            taskName: taskName,
            category: category,
            startDate: startDate,
            interval: interval,
            description: description
        });

        console.log("Document successfully written!");

        // Add subsequent tasks to Firestore at specified intervals
        for (var i = 1; i <= MAX_OCCURRENCES; i++) {
            var next = new Date(start.getTime() + i * interval * 24 * 60 * 60 * 1000);
            var nextDate = next.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

            // Add the next occurrence task to Firestore
            await addDoc(collection(firestore, "tasks"), {
                taskName: taskName,
                category: category,
                startDate: nextDate,
                interval: interval,
                description: description
            });
        }
    } catch (error) {
        console.error("Error writing document: ", error);
    }
}

// Event listener for submit button on add task form
document.addEventListener('click', function(event) {
    if (event.target && event.target.id === 'submitTaskButton') {
        if (auth.currentUser) {
            saveFormData(auth.currentUser);
        } else {
            console.error("No user logged in.");
        }
    }
});

async function displayTasks(user) {
    try {
        if (!user) {
            console.error("User is undefined");
            return;
        }

        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();

        // Fetch task data associated with the logged-in user
        const querySnapshot = await getDocs(collection(firestore, `users/${user.uid}/tasks`));

        // Create a set to store dates for which tasks have already been added
        const addedDates = new Set();
        const eventContainers = document.querySelectorAll('.event-container');
        eventContainers.forEach(container => container.innerHTML = '');

        querySnapshot.forEach((doc) => {
            const task = doc.data();
            console.log("Task data:", task);

            const startDateParts = task.startDate.split('-');
            const startMonth = parseInt(startDateParts[0]) - 1;
            const startDay = parseInt(startDateParts[1]);
            const interval = parseInt(task.interval);

            // Only display tasks if they belong to the current year and have a valid interval
            if (currentYear === parseInt(startDateParts[2]) && !isNaN(interval) && interval > 0) {
                let nextOccurrenceDate = new Date(currentYear, startMonth, startDay);
                while (nextOccurrenceDate.getMonth() <= currentMonth) {

                    // Check if the task for this date has already been added
                    const formattedDate = nextOccurrenceDate.toISOString().slice(0, 10);
                    if (!addedDates.has(formattedDate)) {
                        const cell = document.querySelector(`#calendar .date-block[data-day="${nextOccurrenceDate.getDate()}"]`);
                        if (cell) {
                            let eventContainer = cell.querySelector('.event-container');
                            if (!eventContainer) {
                                eventContainer = document.createElement('div');
                                eventContainer.classList.add('event-container');
                                eventContainer.classList.add('relative');
                                cell.appendChild(eventContainer);
                            }

                            const eventBlock = document.createElement('div');
                            eventBlock.classList.add('event-block', 'rounded-lg', 'bg-orange', 'mx-auto', 'mr-2', 'ml-2', 'mb-2', 'text-navy', 'overflow-hidden');
                            eventBlock.textContent = task.taskName;
                            eventBlock.title = task.taskName;
                            eventBlock.dataset.taskId = doc.id;
                            eventBlock.dataset.category = task.category;
                            eventBlock.dataset.startDate = task.startDate;
                            eventBlock.dataset.interval = task.interval;
                            eventBlock.dataset.description = task.description;
                            eventContainer.appendChild(eventBlock);

                            addedDates.add(formattedDate);
                        }
                    }
                    nextOccurrenceDate.setDate(nextOccurrenceDate.getDate() + interval);
                }
            }
        });

    } catch (error) {
        console.error("Error fetching tasks: ", error);
    }
}

/* ------ Calendar functionality ------ */

// Function to show the add-task-form modal and preload the clicked date into the start date field
function showAddTaskFormModal(clickedDate) {
var addTaskModal = document.getElementById('addTaskModal');
if (addTaskModal) {
    addTaskModal.showModal();
    
    var startDateInput = document.getElementById('startDate');
    if (startDateInput) {
        // Format the clicked date as MM-DD-YYYY
        var formattedDate = formatDate(clickedDate);
        startDateInput.value = formattedDate;
    }
}
};

// Function to format date as MM-DD-YYYY
function formatDate(date) {
    var day = date.getDate();
    var month = date.getMonth() + 1;
    var year = date.getFullYear();
    return (month < 10 ? '0' : '') + month + '-' + (day < 10 ? '0' : '') + day + '-' + year;
    }

// Add event listener to bring up add task form to the date blocks
document.getElementById('calendar').addEventListener('click', function(event) {
    if (event.target.classList.contains('date-block') || event.target.parentElement.classList.contains('date-block')) {
        // Get the clicked date string from the dataset
        var clickedDateStr = event.target.dataset.date;
        console.log("Clicked date:", clickedDateStr);
        if (clickedDateStr) {
            // Parse the date string into a Date object
            var dateParts = clickedDateStr.split('-');
            if (dateParts.length === 3) {
                var month = parseInt(dateParts[0]) - 1;
                var day = parseInt(dateParts[1]);
                var year = parseInt(dateParts[2]);
                var clickedDate = new Date(year, month, day);
                if (!isNaN(clickedDate.getTime())) {
                    showAddTaskFormModal(clickedDate);
                    return;
                }
            }
        } else {
            console.log(event.target.outerHTML);
        }
        console.error("Invalid data-date attribute:", clickedDateStr);
    }
});

// Calendar navigation and rendering calendar
const currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

const monthNames = ["January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"];

                    
const renderCalendar = (user) => {
    const calendarGrid = document.getElementById('calendar');
    // Display the current month and year
    document.getElementById('currentMonth').textContent = `${monthNames[currentMonth]} ${currentYear}`;

    // Function to generate date string in "MM-DD-YYYY" format
    const getDateString = (day, month, year) => {
        return `${month + 1}-${day}-${year}`;
    };

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startingDay = firstDayOfMonth.getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Clear the calendar grid before rendering the new month
    calendarGrid.innerHTML = '';

    // Add empty date blocks for days before the start of the month
    for (let i = 0; i < startingDay; i++) {
        calendarGrid.innerHTML += `<div class="date-block h-16"></div>`;
    }

    // Add date blocks for each day of the month
    for (let i = 1; i <= daysInMonth; i++) {
        const dateString = getDateString(i, currentMonth, currentYear);
        calendarGrid.innerHTML += `<div class="date-block border h-16 text-center text-grey border-grey rounded-md" data-date="${dateString}" data-day="${i}">${i}</div>`;
    }

    // Call displayTasks only if user object is defined
    if (user) {
        displayTasks(user);
    }
};
                    
//event listeners for calendar buttons

document.getElementById('prevMonth').addEventListener('click', () => {
    currentMonth -= 1;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear -= 1;
    }
    renderCalendar();
    if (auth.currentUser) {
        displayTasks(auth.currentUser);
    }
});

document.getElementById('nextMonth').addEventListener('click', () => {
    currentMonth += 1;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear += 1;
    }
    renderCalendar();
    if (auth.currentUser) {
        displayTasks(auth.currentUser);
    }
});

document.getElementById('currentMonthButton').addEventListener('click', () => {
    const now = new Date();
    currentMonth = now.getMonth();
    currentYear = now.getFullYear();
    renderCalendar();
    if (auth.currentUser) {
        displayTasks(auth.currentUser);
    }
});

renderCalendar();

// function to populate the task details modal
function showTaskDetailsModal(taskData) {
    document.getElementById('taskDetailsName').textContent = taskData.taskName;
    document.getElementById('taskDetailsCategory').textContent = taskData.category;
    document.getElementById('taskDetailsStartDate').textContent = taskData.startDate;
    document.getElementById('taskDetailsInterval').textContent = taskData.interval;
    document.getElementById('taskDetailsDescription').textContent = taskData.description;

    var taskDetailsModal = document.getElementById('taskDetailsModal');
    if (taskDetailsModal) {
        taskDetailsModal.showModal();
    }
}

// event listener to show task details modal when task is clicked in calendar
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('event-block')) {
        // Get the task data from the clicked element
        const taskData = {
            taskName: event.target.textContent,
            category: event.target.dataset.category,
            startDate: event.target.dataset.startDate,
            interval: event.target.dataset.interval,
            description: event.target.dataset.description
        };
        // Show task details modal with the task data
        showTaskDetailsModal(taskData);
    }
});

/* -------- Modal and HTML javascript ------- */

// function for drop down menu in navbar
function toggleDropdown() {
    var dropdownMenu = document.getElementById("dropdownMenu");
    dropdownMenu.classList.toggle("hidden")
};

// Function to load modal content from modals.html
function loadModals() {
fetch('modals.html')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.text();
    })
    .then(html => {
        console.log('Modal content fetched successfully:');
        document.body.insertAdjacentHTML('beforeend', html);
        initializeModals();
    })
    .catch(error => {
        console.error('Error fetching modal content:', error);
    });
}

// Function to initialize modals
function initializeModals() {
    var addTaskModal = document.getElementById('addTaskModal');
    var helpModal = document.getElementById('helpModal');

    if (addTaskModal && helpModal) {
        document.getElementById('addTaskButton').addEventListener('click', function() {
            addTaskModal.showModal();
            document.getElementById('submitTaskButton').addEventListener('click', function() {
                saveFormData();
            });
        });

        document.getElementById('helpFooterLink').addEventListener('click', function(event) {
            event.preventDefault();
            helpModal.showModal();
        });
    }
}

// Function to show the add task modal
function showAddTaskModal() {
    var addTaskModal = document.getElementById('addTaskModal');
    if (addTaskModal) {
        addTaskModal.showModal();
    }
}

// Function to show the help modal
function showHelpModal() {
    var helpModal = document.getElementById('helpRequestModal');
    if (helpModal) {
        helpModal.showModal();
    }   
}

// Add event listeners to show modals
document.getElementById('addTaskButton').addEventListener('click', showAddTaskModal);
document.getElementById('helpFooterLink').addEventListener('click', showHelpModal);
document.getElementById('helpLink').addEventListener('click', showHelpModal);

document.addEventListener('DOMContentLoaded', function() {
    loadModals();
});

/* ------- Firebase Auth ------- */

// Function to sign out the user
function signOutUser() {
    signOut(auth).then(() => {
    window.location.href = "index.html";
    }).catch((error) => {
    console.error("Error signing out: ", error);
    });
}

// Add event listener to the sign out link
document.getElementById('signOutLink').addEventListener('click', function(event) {
    event.preventDefault();
    signOutUser();
});