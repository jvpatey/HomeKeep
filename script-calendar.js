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
        displayTasks(user, currentYear, currentMonth);
    } else {
        console.log("No user logged in.");
    }
});

/* ------ Handling FireStore Task Data with Calendar ------ */

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

    interval = parseInt(interval);
    if (interval < 0 || interval > 365) {
        alert("Interval must be between 0 and 365.");
        return;
    }

    try {
        // Convert start date to timestamp
        const startDateTimestamp = new Date(startDate).getTime();

        // Format start date as "MM-DD-YYYY"
        const formattedStartDate = formatDate(new Date(startDateTimestamp));

        // Add the task to Firestore with formatted start date
        await addDoc(collection(firestore, `users/${user.uid}/tasks`), {
            taskName: taskName,
            category: category,
            startDate: formattedStartDate,
            interval: interval,
            description: description
        });

        console.log("Document successfully written!");

        // Reset the form after successful submission
        document.getElementById('addTaskForm').reset();
        document.getElementById('addTaskModal').close();

        // Update the calendar display
        renderCalendar(user);
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

async function displayTasks(user, year, month) {
    try {
        if (!user) {
            console.error("User is undefined");
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
            const task = doc.data();
            console.log("Task data:", task);

            const startDateTimestamp = new Date(task.startDate).getTime();
            const interval = parseInt(task.interval);

            // Calculate the next occurrence date
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
                        eventBlock.classList.add('event-block', 'rounded-lg', 'bg-orange', 'mx-auto', 'mr-2', 'ml-2', 'mb-2', 'text-navy', 'overflow-hidden');
                        eventBlock.textContent = task.taskName;
                        eventBlock.title = task.taskName;
                        eventBlock.dataset.taskId = doc.id;
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

        // Timeout to recalculate the scrollbar after a short delay
        setTimeout(() => {
            const eventContainers = document.querySelectorAll('.event-container');
            eventContainers.forEach(container => {
                if (container.scrollHeight > 60) {
                    container.style.overflowY = 'auto'; // Enable scrollbar
                } else {
                    container.style.overflowY = 'hidden'; // Hide scrollbar
                }
            });
        }, 100);

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
            // Format the clicked date and set it as the value of the start date input
            startDateInput.value = formatDate(clickedDate.getTime());
        }
    }
};

// Function to format timestamp as MM-DD-YYYY
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}-${year}`;
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