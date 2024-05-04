/* ------ Firebase Initialization  ------ */

// Import Firebase, Firestore, Auth
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js'
import { getFirestore, doc, collection, getDoc, setDoc, addDoc, getDocs, deleteDoc, updateDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js'
import { getAuth, signOut } from 'https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyBdfiZqwh7k_iRTpxFyK2_hJy4VpS8PViU",
    authDomain: "homekeep-site.firebaseapp.com",
    projectId: "homekeep-site",
    storageBucket: "homekeep-site.appspot.com",
    messagingSenderId: "135503627537",
    appId: "1:135503627537:web:aabcbcf703a4ec60bbb8b0",
    measurementId: "G-EKK8D35QH8"
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
    if (formSubmitted) return;

    const user = auth.currentUser;
    if (!user) {
        console.error("No user logged in.");
        return;
    }

    formSubmitted = true;

    const rawStartDate = document.getElementById('startDate').value;
    if (!rawStartDate) {
        console.error("Start date is empty.");
        formSubmitted = false;
        return;
    }
    const [year, month, day] = rawStartDate.split('-');
    const formattedDate = `${month}-${day}-${year}`;
    const taskName = document.getElementById('taskName').value;
    const category = document.getElementById('category').value;
    const interval = document.getElementById('interval').value;
    const description = document.getElementById('description').value;

    try {
        await addDoc(collection(firestore, `users/${user.uid}/tasks`), {
            taskName,
            category,
            startDate: formattedDate,
            interval,
            description,
        });

        console.log("Document successfully written!");
        // Close the modal and refresh the page
        const addTaskModal = document.getElementById('addTaskModal');
        if (addTaskModal) {
            addTaskModal.close();
        }

        window.location.reload();
    } catch (error) {
        console.error("Error writing document:", error);
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
    "Appliance Maintenance": "#85BB65",
    "Cleaning": "#1E90FF",
    "Electrical and Safety": "#FF6347",
    "Exterior Maintenance": "#32CD32",
    "Filters and Ventilation": "#00CED1",
    "General Home Maintenance": "#9932CC",
    "Laundry": "#FF4500",
    "Plumbing and Water Systems": "#4682B4",
    "Seasonal Tasks": "#DAA520",
    "Yard Work": "#B8860B",
    "Other": "#8B008B",
};

async function displayTasks(user, year, month) {
    if (!user) {
        console.error("User is not authenticated.");
        return;
    }

    try {
        // Clear all existing event containers to prevent duplicate tasks
        const eventContainers = document.querySelectorAll('.event-container');
        eventContainers.forEach((container) => (container.innerHTML = ''));

        const querySnapshot = await getDocs(collection(firestore, `users/${user.uid}/tasks`));

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        querySnapshot.forEach((doc) => {
            const task = doc.data();
            const taskId = doc.id;

            const taskName = task.taskName;
            const category = task.category || "No Category";
            const rawStartDate = task.startDate;
            const interval = parseInt(task.interval || "365");
            const description = task.description || "No Description";

            const [monthStr, dayStr, yearStr] = rawStartDate.split('-');
            const taskStartDate = new Date(
                parseInt(yearStr),
                parseInt(monthStr) - 1,
                parseInt(dayStr)
            );

            if (isNaN(taskStartDate.getTime())) {
                console.error("Invalid task start date:", rawStartDate);
                return;
            }

            let nextOccurrenceDate = new Date(taskStartDate);

            while (nextOccurrenceDate <= lastDayOfMonth) {
                if (nextOccurrenceDate >= firstDayOfMonth && nextOccurrenceDate <= lastDayOfMonth) {
                    const dayOfMonth = nextOccurrenceDate.getDate();
                    const cell = document.querySelector(`#calendar .date-block[data-day="${dayOfMonth}"]`);

                    if (cell) {
                        let eventContainer = cell.querySelector('.event-container');
                        if (!eventContainer) {
                            eventContainer = document.createElement('div');
                            eventContainer.classList.add('event-container', 'relative');
                            cell.appendChild(eventContainer);
                        }

                        const eventBlock = document.createElement('div');
                        eventBlock.classList.add(
                            'event-block',
                            'rounded-lg',
                            'mx-auto',
                            'mr-2',
                            'ml-2',
                            'mb-2',
                            'mt-2',
                            'pl-1',
                            'pr-1',
                            'text-paper',
                            'text-steel',
                            'overflow-hidden',
                            'hover:text-charcoal'
                        );

                        eventBlock.style.backgroundColor =
                            categoryColors[category] || '#D3D3D3';
                        eventBlock.textContent = taskName;
                        eventBlock.title = taskName;

                        eventBlock.dataset.taskId = taskId;
                        eventBlock.dataset.category = category;
                        eventBlock.dataset.startDate = rawStartDate;
                        eventBlock.dataset.interval = interval.toString();
                        eventBlock.dataset.description = description;

                        eventContainer.appendChild(eventBlock);
                    }
                }
                nextOccurrenceDate.setDate(nextOccurrenceDate.getDate() + interval);
            }
        });

        // Handle scrollbars in event containers
        setTimeout(() => {
            const eventContainers = document.querySelectorAll('.event-container');
            eventContainers.forEach((container) => {
                container.style.overflowY = container.scrollHeight > 60 ? 'auto' : 'hidden';
            });
        }, 100);
    } catch (error) {
        console.error("Error fetching tasks:", error);
    }
}

/* ------ Calendar functionality ------ */

function showAddTaskFormModal(clickedDate = null) {
    const addTaskModal = document.getElementById('addTaskModal');
    if (addTaskModal) {
        addTaskModal.showModal();

        const startDateInput = document.getElementById('startDate');
        if (startDateInput) {
            if (clickedDate instanceof Date && !isNaN(clickedDate.getTime())) {
                const formattedDate = clickedDate.toISOString().split('T')[0];
                startDateInput.value = formattedDate;
            } else {
                startDateInput.value = '';
            }
        }
    }
}


// Show the add task modal when date block is clicked in calendar
document.getElementById('calendar').addEventListener('click', function(event) {
    if (event.target.classList.contains('date-block') || event.target.parentElement.classList.contains('date-block')) {
        const clickedDateStr = event.target.dataset.date;
        console.log("Clicked date:", clickedDateStr);
        let clickedDate = null;

        if (clickedDateStr) {
            const dateParts = clickedDateStr.split('-');
            if (dateParts.length === 3) {
                const month = parseInt(dateParts[0]) - 1;
                const day = parseInt(dateParts[1]);
                const year = parseInt(dateParts[2]);
                clickedDate = new Date(year, month, day);

                if (!isNaN(clickedDate.getTime())) {
                    showAddTaskFormModal(clickedDate);
                } else {
                    console.error("Invalid date created:", clickedDateStr);
                }
            }
        }
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

        let dateBlock = `<div class="date-block border h-16 text-center text-charcoal border-charcoal dark:text-clean dark:border-clean rounded-md" data-date="${dateString}" data-day="${i}">${i}</div>`;

        if (currentDate.getMonth() === today.getMonth() && currentDate.getDate() === today.getDate()) {
            dateBlock = `<div class="date-block border h-16 text-center text-charcoal border-charcoal rounded-md current-day" data-date="${dateString}" data-day="${i}">${i}</div>`;
        }

        calendarGrid.innerHTML += dateBlock;
    }
    if (user) {
        displayTasks(user, currentYear, currentMonth);
    }
};
                                                 
// event listeners for calendar buttons
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

let currentTaskId = null;
function showTaskDetailsModal(taskData) {
    // Ensure the task data and task ID are valid
    if (!taskData || !taskData.taskId) {
        console.error("Task data or task ID is missing.");
        return;
    }
    currentTaskId = taskData.taskId;

    const taskDetailsModal = document.getElementById('taskDetailsModal');
    const taskNameElement = document.getElementById('taskDetailsName');
    const taskCategoryElement = document.getElementById('taskDetailsCategory');
    const taskStartDateElement = document.getElementById('taskDetailsStartDate');
    const taskIntervalElement = document.getElementById('taskDetailsInterval');
    const taskDescriptionElement = document.getElementById('taskDetailsDescription');

    if (!taskDetailsModal || !taskNameElement || !taskCategoryElement || !taskStartDateElement || !taskIntervalElement || !taskDescriptionElement) {
        console.error("Task details modal or its elements are missing.");
        return;
    }

    // Assign default values if task data is missing
    const taskName = taskData.taskName || "No Name";
    const taskCategory = taskData.category || "No Category";
    const taskStartDate = taskData.startDate ? convertToMMDDYYYY(taskData.startDate) : "Unknown Start Date";
    const taskInterval = intervalTextMapping[taskData.interval] || "Unknown Interval";
    const taskDescription = taskData.description || "No Description";

    // Assign data to modal fields
    taskNameElement.textContent = taskName;
    taskCategoryElement.textContent = taskCategory;
    taskStartDateElement.textContent = taskStartDate;
    taskIntervalElement.textContent = taskInterval;
    taskDescriptionElement.textContent = taskDescription;

    // Show the task details modal
    taskDetailsModal.showModal();
}

// Show task details modal when event block is clicked in calendar
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('event-block')) {
        const taskId = event.target.dataset.taskId;
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

        showTaskDetailsModal(taskData);
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
            initializeModals();
        })
        .catch(error => {
            console.error('Error fetching modal content:', error);
        });
}

let lastFunction;

// Delete function with confirmation prompt for calendar view
async function deleteTask() {
    const user = auth.currentUser;

    if (!user) {
        console.error("User is not authenticated.");
        return;
    }

    if (!currentTaskId) {
        console.error("No task ID specified for deletion.");
        return;
    }

    // Ask for confirmation before deleting
    const confirmDelete = window.confirm("Are you sure you want to delete this task?");
    if (!confirmDelete) {
        console.log("Task deletion canceled by user.");
        return;
    }

    try {
        const docRef = doc(collection(firestore, `users/${user.uid}/tasks`), currentTaskId);
        await deleteDoc(docRef);
        console.log("Task successfully deleted!");

        const taskDetailsModal = document.getElementById('taskDetailsModal');
        if (taskDetailsModal && taskDetailsModal.open) {
            taskDetailsModal.close();
        }

        // Refresh the calendar after deleting the task
        displayTasks(user, currentYear, currentMonth);
    } catch (error) {
        console.error("Error deleting task:", error);
    }
}


// Function to initialize modals and event listeners
function initializeModals() {
    const addTaskModal = document.getElementById('addTaskModal');
    const deleteTaskButton = document.getElementById('deleteTaskButton');
    const editTaskButton = document.getElementById('editTaskButton');

    if (addTaskModal) {
        document.getElementById('addTaskButton').addEventListener('click', showAddTaskFormModal);
        document.getElementById('submitTaskButton').addEventListener('click', saveFormData);
    }

    if (deleteTaskButton) {
        deleteTaskButton.addEventListener('click', async () => {
            if (currentTaskId) {
                await deleteTask();
            } else {
                console.error("Task ID is missing.");
            }
        });
    }

    if (editTaskButton) {
        editTaskButton.addEventListener('click', async () => {
            await showEditTaskFormModal();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeModals();
});


// Function to show the edit task modal with preloaded data
async function showEditTaskFormModal() {
    const user = auth.currentUser;
    if (!user || !currentTaskId) {
        console.error("User not logged in or no task ID specified.");
        return;
    }

    const docRef = doc(collection(firestore, `users/${user.uid}/tasks`), currentTaskId);

    const docSnapshot = await getDoc(docRef);
    if (docSnapshot.exists()) {
        const taskData = docSnapshot.data();

        const editTaskForm = document.getElementById('editTaskForm');

        if (editTaskForm) {
            // Ensure previous event listeners are removed
            if (lastFunction !== undefined) {
                editTaskForm.removeEventListener('submit', lastFunction);
            }

            editTaskForm.querySelector('#editTaskName'). value = taskData.taskName;
            editTaskForm.querySelector('#editCategory'). value = taskData.category;
            editTaskForm.querySelector('#editStartDate').value = convertToISO(taskData.startDate);

            const intervalText = intervalTextMapping[taskData.interval] || taskData.interval;
            const editInterval = editTaskForm.querySelector('#editInterval');
            for (let option of editInterval.options) {
                if (option.text === intervalText) {
                    option.selected = true;
                    break;
                }
            }

            editTaskForm.querySelector('#editDescription').value = taskData.description;

            // submission of the form
            lastFunction = async (event) => {
                event.preventDefault();

                const rawStartDate = editTaskForm.querySelector('#editStartDate').value;
                const formattedStartDate = convertToMMDDYYYY(rawStartDate);

                const updatedTaskData = {
                    taskName: editTaskForm.querySelector('#editTaskName').value,
                    category: editTaskForm.querySelector('#editCategory').value,
                    startDate: formattedStartDate,
                    interval: editTaskForm.querySelector('#editInterval').value,
                    description: editTaskForm.querySelector('#editDescription').value,
                };

                const docRef = doc(collection(firestore, `users/${auth.currentUser.uid}/tasks`), currentTaskId);

                try {
                    await updateDoc(docRef, updatedTaskData);
                    console.log("Task successfully updated!");
                    const editTaskModal = document.getElementById('editTaskModal');
                    const taskDetailsModal = document.getElementById('taskDetailsModal');

                    if (editTaskModal) {
                        editTaskModal.close();
                    }

                    if (taskDetailsModal) {
                        taskDetailsModal.close();
                    }

                    displayTasks(auth.currentUser, currentYear, currentMonth);
                } catch (error) {
                    console.error("Error updating task:", error);
                }
            };

            // Add the event listener for form submission
            editTaskForm.addEventListener('submit', lastFunction);
            document.getElementById('editTaskModal').showModal();
        }
    } else {
        console.error("Task data does not exist.");
    }
}

// Function to convert MM-DD-YYYY to ISO
function convertToISO(dateString) {
    const [month, day, year] = dateString.split('-');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Function to convert a UTC Date to MM-DD-YYYY for display
function convertToMMDDYYYY(dateString) {
    const date = new Date(dateString);
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${month}-${day}-${year}`;
}

// Function to update task data in Firestore
async function updateTask(updatedTaskData, docRef) {
    try {
        await updateDoc(docRef, updatedTaskData);
        console.log("Task successfully updated!");
    } catch (error) {
        console.error("Error updating document: ", error);
    }
}

// Function to show the chat modal when the chat icon is clicked
function toggleChatModal() {
    const chatModal = document.getElementById("chatModal");
    chatModal.style.display = chatModal.style.display === "block" ? "none" : "block";
}

document.addEventListener('DOMContentLoaded', () => {
    loadModals();
    initializeModals();

    document.getElementById("chatIcon").addEventListener("click", toggleChatModal);

    const editSubmitBtn = document.getElementById('editSubmitBtn');

    if (editSubmitBtn) {
        editSubmitBtn.addEventListener('click', (event) => {
            event.preventDefault();
            updateTask();
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const dropdownButton = document.querySelector('.dropdown .btn-ghost');
    const dropdownContent = document.querySelector('.dropdown-content');
    
    dropdownButton.addEventListener('click', function(event) {
      event.stopPropagation();
      
      // Check if the dropdown is open
      const isOpen = dropdownContent.style.display === 'block'; 
      
      // Toggle display
      if (isOpen) {
        dropdownContent.style.display = 'none';
      } else {
        dropdownContent.style.display = 'block';
      }
    });
  
    // Close the dropdown if clicked outside
    document.addEventListener('click', function() {
      dropdownContent.style.display = 'none';
    });
  });

// Dark Mode functionality //

// Toggle dark mode and save the preference to local storage
function toggleDarkMode() {
    const body = document.querySelector("body");
    const icon = document.getElementById("darkModeToggle").querySelector("i");
  
    if (body.classList.contains("dark")) {
      body.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
      icon.className = "fa-solid fa-moon text-charcoal hover:text-marine";
    } else {
      body.classList.add("dark");
      localStorage.setItem("darkMode", "true");
      icon.className = "fa-solid fa-sun text-feather hover:text-marine";
    }
  }
  
  // Event listener for the dark mode toggle button
  document.getElementById("darkModeToggle").addEventListener("click", toggleDarkMode);
  
  // Apply the correct dark mode setting on page load
  window.addEventListener("load", function() {
    const darkMode = localStorage.getItem("darkMode");
    const body = document.querySelector("body");
    const icon = document.getElementById("darkModeToggle").querySelector("i");
  
    if (darkMode === "true") {
      body.classList.add("dark");
      icon.className = "fa-solid fa-sun text-feather hover:text-marine";
    } else {
      body.classList.remove("dark");
      icon.className = "fa-solid fa-moon text-charcoal hover:text-marine";
    }
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