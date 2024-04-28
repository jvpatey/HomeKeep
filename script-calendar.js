/* ------ Firebase Initialization  ------ */

// Import Firebase, Firestore, Auth
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js'
import { getFirestore, doc, collection, getDoc, setDoc, addDoc, getDocs, deleteDoc, updateDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js'
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
auth.onAuthStateChanged(user => {
    if (user) {
        console.log("User is logged in:", user);
        displayTasks(user, currentYear, currentMonth);
    } else {
        console.log("No user logged in.");
    }
});

/* ------ Handling FireStore Task Data with Calendar ------ */

function convertToMMDDYYYY(dateString) {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
}

let formSubmitted = false;

async function saveFormData() {
    if (formSubmitted) {
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        console.error("No user logged in.");
        return;
    }

    formSubmitted = true;

    // Extract form data
    const taskName = document.getElementById('taskName').value;
    const category = document.getElementById('category').value;
    const rawStartDate = document.getElementById('startDate').value;
    const formattedStartDate = convertToMMDDYYYY(rawStartDate); // Format the date to MM-DD-YYYY
    const interval = document.getElementById('interval').value;
    const description = document.getElementById('description').value;

    // Validate the start date format
    const datePattern = /^\d{2}-\d{2}-\d{4}$/;
    if (!datePattern.test(formattedStartDate)) {
        alert("Please enter the start date in the format MM-DD-YYYY.");
        formSubmitted = false;
        return;
    }

    // Take month, day, and year from the formatted start date
    const [startMonth, startDay, startYear] = formattedStartDate.split('-').map(Number);
    if (startMonth < 1 || startMonth > 12 || startDay < 1 || startDay > 31 || startYear < 1900 || startYear > 2100) {
        alert("Please enter a valid start date (MM-DD-YYYY).");
        formSubmitted = false;
        return;
    }

    try {
        // Add a new document with a generated ID and user's authentication information
        const userDocRef = doc(firestore, 'users', user.uid);
        const docSnapshot = await getDoc(userDocRef);

        if (!docSnapshot.exists()) {
            await setDoc(userDocRef, {});
        }
        await addDoc(collection(firestore, `users/${user.uid}/tasks`), {
            taskName: taskName,
            category: category,
            startDate: formattedStartDate, // Ensure formatted date
            interval: interval,
            description: description
        });
        console.log("Document successfully written!");

        // Update the table with the new task
        displayTasks(user, currentYear, currentMonth);

        // Reset form and close modal
        document.getElementById('addTaskForm').reset();
        document.getElementById('addTaskModal').close();
    } catch (error) {
        console.error("Error writing document: ", error);
    } finally {
        formSubmitted = false;
    }
}

// Mapping from interval value to display text
const intervalTextMapping = {
    "1": "Daily",
    "7": "Weekly",
    "14": "Bi-Weekly",
    "30": "Monthly",
    "90": "Quarterly",
    "180": "Bi-Annually",
    "365": "Annually",
};

const categoryColors = {
    "Appliance Maintenance": "#556B2F",
    "Cleaning": "#4682B4",
    "Electrical and Safety": "#708090",
    "Exterior Maintenance": "#6B8E23",
    "Filters and Ventilation": "#8FBC8F",
    "General Home Maintenance": "#2F4F4F",
    "Laundry": "#696969",
    "Plumbing and Water Systems": "#5F9EA0",
    "Seasonal Tasks": "#6A5ACD",
    "Yard Work": "#8B4513",
    "Other": "#A0522D",
};

async function displayTasks(user, year, month) {
    try {
        if (!user) {
            return;
        }

        console.log("Year:", year);
        console.log("Month:", month);

        // Fetch task data associated with the logged-in user
        const querySnapshot = await getDocs(collection(firestore, `users/${user.uid}/tasks`));

        // Clear the calendar of existing tasks
        const eventContainers = document.querySelectorAll('.event-container');
        eventContainers.forEach(container => container.innerHTML = '');

        querySnapshot.forEach((doc) => {
            const task = doc.data(); // Get the task data
            const taskData = {
                taskId: doc.id, // Ensure the task ID is included
                taskName: task.taskName,
                category: task.category,
                startDate: task.startDate,
                interval: task.interval,
                description: task.description
            };

            const startDateTimestamp = new Date(task.startDate).getTime();
            const interval = parseInt(task.interval);

            // Calculate the next occurrence date for the task and add it to the calendar
            let nextOccurrenceDate = new Date(startDateTimestamp);
            while (nextOccurrenceDate <= new Date(year, month + 1, 0)) {
                if (nextOccurrenceDate.getFullYear() === year && nextOccurrenceDate.getMonth() === month) {
                    const formattedDate = nextOccurrenceDate.toISOString().slice(0, 10);
                    const dayOfMonth = nextOccurrenceDate.getDate();
                    const cell = document.querySelector(`#calendar .date-block[data-day="${dayOfMonth}"]`);
                    if (cell) {
                        let eventContainer = cell.querySelector('.event-container');
                        if (!eventContainer) {
                            eventContainer = document.createElement('div');
                            eventContainer.classList.add('event-container');
                            eventContainer.classList.add('relative');
                            cell.appendChild(eventContainer);
                        }

                        const eventBlock = document.createElement('div');
                        eventBlock.classList.add('event-block', 'rounded-lg', 'mx-auto', 'mr-2', 'ml-2', 'mb-2', 'mt-2', 'pl-1', 'pr-1', 'text-paper', 'overflow-hidden', 'hover:text-charcoal');

                        // Set background color based on category
                        eventBlock.style.backgroundColor = categoryColors[task.category];

                        eventBlock.textContent = task.taskName;
                        eventBlock.title = task.taskName;
                        eventBlock.dataset.taskId = taskData.taskId;
                        eventBlock.dataset.category = task.category;
                        eventBlock.dataset.startDate = task.startDate;
                        eventBlock.dataset.interval = task.interval;
                        eventBlock.dataset.description = task.description;
                        eventContainer.appendChild(eventBlock);
                    }
                }
                // Move to the next occurrence date
                nextOccurrenceDate.setDate(nextOccurrenceDate.getDate() + interval);
            }
        });

        // Add scrollbar to date block if needed
        setTimeout(() => {
            const eventContainers = document.querySelectorAll('.event-container');
            eventContainers.forEach(container => {
                if (container.scrollHeight > 60) {
                    container.style.overflowY = 'auto';
                    container.style.scrollbarBackgroundColor = 'transparent';
                } else {
                    container.style.overflowY = 'hidden';
                }
            });
        }, 100);

    } catch (error) {
        console.error("Error fetching tasks: ", error);
    }
}


/* ------ Calendar functionality ------ */

// Function to show the add-task-form modal
function showAddTaskFormModal(clickedDate = null) {
    var addTaskModal = document.getElementById('addTaskModal');
    if (addTaskModal) {
        addTaskModal.showModal();
        
        const startDateInput = document.getElementById('startDate');
        if (startDateInput) {
            if (clickedDate) { // Only preload if a date is provided
                startDateInput.value = formatDate(clickedDate.getTime());
            } else { // Clear the input if no date is provided
                startDateInput.value = ''; 
            }
        }
    }
};

// Function to format date as YYYY-MM-DD
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Add event listener to bring up add task form to the date blocks when clicked
document.getElementById('calendar').addEventListener('click', function(event) {
    if (event.target.classList.contains('date-block') || event.target.parentElement.classList.contains('date-block')) {
        // Get the clicked date string from the dataset
        var clickedDateStr = event.target.dataset.date;
        console.log("Clicked date:", clickedDateStr);
        if (clickedDateStr) {
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

    const today = new Date();
    const currentDay = today.getDate();

    calendarGrid.innerHTML = '';

    // Add empty date blocks for days before the start of the month
    for (let i = 0; i < startingDay; i++) {
        calendarGrid.innerHTML += `<div class="date-block h-16"></div>`;
    }

    // Add date blocks for each day of the month
    for (let i = 1; i <= daysInMonth; i++) {
        const dateString = getDateString(i, currentMonth, currentYear);
        const currentDate = new Date(currentYear, currentMonth, i);

        let dateBlock = `<div class="date-block border h-16 text-center text-charcoal border-charcoal rounded-md" data-date="${dateString}" data-day="${i}">${i}</div>`;

        if (currentDate.getMonth() === today.getMonth() && currentDate.getDate() === today.getDate()) {
            dateBlock = `<div class="date-block border h-16 text-center text-charcoal border-charcoal rounded-md current-day" data-date="${dateString}" data-day="${i}">${i}</div>`;
        }

        calendarGrid.innerHTML += dateBlock;
    }
    if (user) {
        displayTasks(user, currentYear, currentMonth);
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
        displayTasks(auth.currentUser, currentYear, currentMonth);
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
        displayTasks(auth.currentUser, currentYear, currentMonth);
    }
});

document.getElementById('currentMonthButton').addEventListener('click', () => {
    const now = new Date();
    currentMonth = now.getMonth();
    currentYear = now.getFullYear();
    renderCalendar();
    if (auth.currentUser) {
        displayTasks(auth.currentUser, currentYear, currentMonth);
    }
});

renderCalendar();

let currentTaskId = null; // Declare at a global scope
function showTaskDetailsModal(taskData) {
    if (!taskData.taskId) {
        console.error("Task ID is missing.");
        return;
    }

    currentTaskId = taskData.taskId; // Store the current task ID
    // Update the modal content
    document.getElementById('taskDetailsName').textContent = taskData.taskName;
    document.getElementById('taskDetailsCategory').textContent = taskData.category;
    document.getElementById('taskDetailsStartDate').textContent = taskData.startDate;
    document.getElementById('taskDetailsInterval').textContent = intervalTextMapping[taskData.interval] || 'Unknown Interval';
    document.getElementById('taskDetailsDescription').textContent = taskData.description;

    // Open the modal
    const taskDetailsModal = document.getElementById('taskDetailsModal');
    if (taskDetailsModal) {
        taskDetailsModal.showModal();
    }
}

async function deleteTask() {
    if (!currentTaskId) {
        console.error("Task ID is missing.");
        return;
    }

    const user = auth.currentUser;
    if (user) {
        const docRef = doc(collection(firestore, `users/${user.uid}/tasks`), currentTaskId);

        const userConfirmed = confirm("Are you sure you want to delete this task?");
        
        if (userConfirmed) {
            try {
                await deleteDoc(docRef);
                console.log("Task deleted successfully.");
                const taskDetailsModal = document.getElementById('taskDetailsModal');
                if (taskDetailsModal) {
                    taskDetailsModal.close();
                }
                displayTasks(user, currentYear, currentMonth); // Refresh the tasks
            } catch (error) {
                console.error("Error deleting task:", error);
            }
        }
    }
}


document.addEventListener('click', function(event) {
    if (event.target.classList.contains('event-block')) {
        const taskId = event.target.dataset.taskId; // Retrieve the task ID
        if (!taskId) {
            console.error("Task ID is missing.");
            return;
        }

        const taskData = {
            taskId: taskId,
            taskName: event.target.textContent,
            category: event.target.dataset.category,
            startDate: event.target.dataset.startDate,
            interval: event.target.dataset.interval,
            description: event.target.dataset.description
        };

        showTaskDetailsModal(taskData); // Pass the task data, including task ID
    }
});


/* -------- Modal and HTML javascript ------- */

// Function to load modal content from modals.html and initialize the modals
function loadModals() {
    return fetch('modals.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(html => {
            console.log('Modal content loaded successfully');
            document.body.insertAdjacentHTML('beforeend', html);
            initializeModals(); // Initialize the event listeners after modals are loaded
        })
        .catch(error => {
            console.error('Error fetching modal content:', error);
        });
}


function initializeModals() {
    const addTaskModal = document.getElementById('addTaskModal');
    const deleteTaskButton = document.getElementById('deleteTaskButton'); // Your delete button's ID

    if (addTaskModal) {
        document.getElementById('addTaskButton').addEventListener('click', showAddTaskFormModal);
        document.getElementById('submitTaskButton').addEventListener('click', saveFormData);
    }

    if (deleteTaskButton) {
        deleteTaskButton.onclick = () => {
            if (currentTaskId) {
                deleteTask();
            } else {
                console.error("Task ID is missing.");
            }
        };
    }
}

// Function to show the chat modal when the chat icon is clicked
function toggleChatModal() {
    const chatModal = document.getElementById("chatModal");
    chatModal.style.display = chatModal.style.display === "block" ? "none" : "block";
}

document.addEventListener('DOMContentLoaded', () => {
    loadModals();

    // Show chat modal when chat icon is clicked
    document.getElementById("chatIcon").addEventListener("click", toggleChatModal);
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