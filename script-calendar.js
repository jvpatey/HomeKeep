/* ------ Firebase Initialization  ------ */

// Import Firebase, Firestore, Auth
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js'
import { getFirestore, doc, collection, getDoc, addDoc, getDocs, deleteDoc, updateDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js'
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
const messagesCollection = collection(firestore, 'messages');
const responsesCollection = collection(firestore, 'responses');

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

/* ----- Firebase messages via chat ----- */

// Function to send a message to Firestore
async function sendMessage(message) {
    try {
        await addDoc(messagesCollection, {
            sender: 'user',
            content: message,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error sending message:", error);
    }
}

// Function to handle receiving messages from Firestore
function receiveMessage(snapshot) {
    snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
            const message = change.doc.data();
            const messagesContainer = document.getElementById('messagesContainer');
            const messageElement = document.createElement('div');
            messageElement.textContent = message.sender + ': ' + message.content;
            messagesContainer.appendChild(messageElement);
        }
    });
}

// Listen for new messages from Firestore
onSnapshot(messagesCollection, receiveMessage);

// Function to handle receiving response messages from Firestore
function receiveResponse(snapshot) {
    snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
            const response = change.doc.data();
            const messagesContainer = document.getElementById('messagesContainer');
            const responseElement = document.createElement('div');
            responseElement.textContent = response.sender + ': ' + response.content;
            messagesContainer.appendChild(responseElement);
        }
    });
}

// Listen for new response messages from Firestore
onSnapshot(responsesCollection, receiveResponse);

// Function to handle form submission
function handleSubmit(event) {
    event.preventDefault();
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    if (message !== '') {
        sendMessage(message);
        messageInput.value = '';
    }
}

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
        displayTasks();

        // Reset form and close modal
        document.getElementById('addTaskForm').reset();
        document.getElementById('addTaskModal').close();
    } catch (error) {
        console.error("Error writing document: ", error);
    } finally {
        formSubmitted = false;
    }
}

// Add event listener for submit button on add task form
document.addEventListener('click', function(event) {
    if (event.target && event.target.id === 'submitTaskButton') {
        saveFormData();
    }
});

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

            // Calculate the next occurrence date
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
                        eventBlock.classList.add('event-block', 'rounded-lg', 'bg-marine', 'mx-auto', 'mr-2', 'ml-2', 'mb-2', 'mt-2', 'pl-1', 'pr-1', 'text-charcoal', 'overflow-hidden', 'hover:bg-charcoal', 'hover:text-marine');
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

// Function to show the add-task-form modal and preload the clicked date into the start date field
function showAddTaskFormModal(clickedDate) {
    var addTaskModal = document.getElementById('addTaskModal');
    if (addTaskModal) {
        addTaskModal.showModal();
        
        var startDateInput = document.getElementById('startDate');
        if (startDateInput) {
            // Format the clicked date and set it as the value of the start date input on form
            startDateInput.value = formatDate(clickedDate.getTime());
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

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startingDay = firstDayOfMonth.getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const today = new Date();
    const currentDay = today.getDate();

    calendarGrid.innerHTML = '';

    // Add date blocks for each day of the month
    for (let i = 1; i <= daysInMonth; i++) {
        const currentDate = new Date(currentYear, currentMonth, i);
        const dayOfWeek = daysOfWeek[currentDate.getDay()]; // Get the day of the week for the current date
        const dateString = getDateString(i, currentMonth, currentYear);

        let dateBlock = `<div class="date-block border h-16 text-center text-charcoal border-charcoal rounded-md" data-date="${dateString}" data-day="${i}">
                            <div class="day-info">
                                <span class="day-of-week">${dayOfWeek}</span>
                                <span class="day-of-month">${i}</span>
                            </div>
                        </div>`;

        if (currentDate.getMonth() === today.getMonth() && currentDate.getDate() === today.getDate()) {
            dateBlock = `<div class="date-block border h-16 text-center text-charcoal border-charcoal rounded-md current-day" data-date="${dateString}" data-day="${i}">
                            <div class="day-info">
                                <span class="day-of-week">${dayOfWeek}</span>
                                <span class="day-of-month">${i}</span>
                            </div>
                        </div>`;
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
    var chatForm = document.getElementById('chatForm');

    if (addTaskModal && chatForm) {
        document.getElementById('addTaskButton').addEventListener('click', function() {
            addTaskModal.showModal();
            document.getElementById('submitTaskButton').addEventListener('click', function() {
                saveFormData();
            });
        });

    // Event listener for chat form submission
    chatForm.addEventListener('submit', handleSubmit);
    } else {
        console.error("One or more modals or signup form not found in the loaded content.");
    }
    
}

// Function to show the add task modal
function showAddTaskModal() {
    var addTaskModal = document.getElementById('addTaskModal');
    if (addTaskModal) {
        addTaskModal.showModal();
    }
}

function toggleChatModal() {
    var chatModal = document.getElementById("chatModal");
    if (chatModal.style.display === "block") {
        chatModal.style.display = "none";
    } else {
        chatModal.style.display = "block";
    }
}

// Add event listeners to show modals
document.getElementById('addTaskButton').addEventListener('click', showAddTaskModal);
document.getElementById("chatIcon").addEventListener("click", toggleChatModal)

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