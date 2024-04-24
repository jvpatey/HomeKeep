/* ------ Firebase Initialization  ------ */

// Import Firebase, Firestore, Auth
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js'
import { getFirestore, doc, collection, addDoc, getDocs } from 'https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js'
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
    const startDateParts = rawStartDate.split('-');
    const formattedStartDate = `${startDateParts[1]}-${startDateParts[2]}-${startDateParts[0]}`; // Convert to MM-DD-YYYY format
    const rawEndDate = document.getElementById('endDate').value;
    const endDateParts = rawEndDate.split('-');
    const formattedEndDate = `${endDateParts[1]}-${endDateParts[2]}-${endDateParts[0]}`; // Convert to MM-DD-YYYY format
    const interval = document.getElementById('interval').value;
    const description = document.getElementById('description').value;

    // Validate the start date format
    const datePattern = /^\d{2}-\d{2}-\d{4}$/;
    if (!datePattern.test(formattedStartDate)) {
        alert("Please enter the start date in the format MM-DD-YYYY.");
        formSubmitted = false;
        return;
    }

    // Validate the end date format
    if (!datePattern.test(formattedEndDate)) {
        alert("Please enter the end date in the format MM-DD-YYYY.");
        formSubmitted = false;
        return;
    }

    // Ensure end date is after start date
    const startDateObj = new Date(formattedStartDate);
    const endDateObj = new Date(formattedEndDate);
    if (endDateObj <= startDateObj) {
        alert("End date must be after start date.");
        formSubmitted = false;
        return;
    }

    // Take month, day, and year from the start date input
    const [startMonth, startDay, startYear] = formattedStartDate.split('-').map(Number);
    if (startMonth < 1 || startMonth > 12 || startDay < 1 || startDay > 31 || startYear < 1900 || startYear > 2100) {
        alert("Please enter a valid start date (MM-DD-YYYY).");
        formSubmitted = false;
        return;
    }

    // Take month, day, and year from the end date input
    const [endMonth, endDay, endYear] = formattedEndDate.split('-').map(Number);
    if (endMonth < 1 || endMonth > 12 || endDay < 1 || endDay > 31 || endYear < 1900 || endYear > 2100) {
        alert("Please enter a valid end date (MM-DD-YYYY).");
        formSubmitted = false;
        return;
    }

    try {
        // Add a new document with a generated ID and user's authentication information
        await addDoc(collection(firestore, `users/${user.uid}/tasks`), {
            taskName: taskName,
            category: category,
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            interval: interval,
            description: description
        });
        console.log("Document successfully written!");

        // Call displayTasks to update the table with the new task
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

const categoryColors = {
    "Appliance Maintenance": "#FD8A8A",
    "Cleaning": "#FFCBCB",
    "Electrical and Safety": "#9EA1D4",
    "Exterior Maintenance": "#F1F7B5",
    "Filters and Ventilation": "#A8D1D1",
    "General Home Maintenance": "#DFEBEB",
    "Laundry": "#FAD1FA",
    "Plumbing and Water Systems": "#FEC868",
    "Seasonal Tasks": "#CDE8E6",
    "Yard Work": "#F9DC5C",
    "Other": "#E8E8E4"
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
            const task = doc.data();
            console.log("Task data:", task);

            const startDateTimestamp = new Date(task.startDate).getTime();
            const interval = parseInt(task.interval);
            const endDate = task.endDate ? new Date(task.endDate).getTime() : null;

            // Calculate the next occurrence date for the task and add it to the calendar
            let nextOccurrenceDate = new Date(startDateTimestamp);
            while (nextOccurrenceDate <= new Date(year, month + 1, 0)) {
                // Check if the task exceeds the end date (if available)
                if (endDate && nextOccurrenceDate > endDate) {
                    break;
                }
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
                        eventBlock.classList.add('event-block', 'rounded-lg', 'mx-auto', 'mr-2', 'ml-2', 'mb-2', 'mt-2', 'pl-1', 'pr-1', 'text-charcoal', 'overflow-hidden', 'hover:bg-charcoal', 'hover:text-marine');

                        // Set background color based on category
                        eventBlock.style.backgroundColor = categoryColors[task.category];

                        eventBlock.textContent = task.taskName;
                        eventBlock.title = task.taskName;
                        eventBlock.dataset.taskId = doc.id;
                        eventBlock.dataset.category = task.category;
                        eventBlock.dataset.startDate = task.startDate;
                        eventBlock.dataset.endDate = task.endDate;
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

function showTaskDetailsModal(taskData) {
    document.getElementById('taskDetailsName').textContent = taskData.taskName;
    document.getElementById('taskDetailsCategory').textContent = taskData.category;
    document.getElementById('taskDetailsStartDate').textContent = taskData.startDate;
    document.getElementById('taskDetailsEndDate').textContent = taskData.endDate; // Populate end date
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
            endDate: event.target.dataset.endDate,
            interval: event.target.dataset.interval,
            description: event.target.dataset.description
        };
        showTaskDetailsModal(taskData);
    }
});

/* -------- Modal and HTML javascript ------- */

// Function to load modal content from modals.html and initialize the modals
function loadModals() {
    fetch('modals.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(html => {
            console.log('Modal content fetched successfully');
            document.body.insertAdjacentHTML('beforeend', html);
            initializeModals();
        })
        .catch(error => {
            console.error('Error fetching modal content:', error);
        });
}

// Function to initialize modal-related event listeners
function initializeModals() {
    const addTaskModal = document.getElementById('addTaskModal');

    if (addTaskModal) {
        document.getElementById('addTaskButton').addEventListener('click', () => {
            showAddTaskFormModal();
        });

        // Call the form submission function when the submit button is clicked
        document.getElementById('submitTaskButton').addEventListener('click', saveFormData);
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