/* ------ Firebase Initialization ------- */

// Import Firebase, Firestore, Auth
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js'
import { getFirestore, collection, doc, addDoc, getDoc, setDoc, getDocs, deleteDoc, updateDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js'
import { getAuth, signOut } from 'https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js';

// Firbase config
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
auth.onAuthStateChanged(user => {
    if (user) {
        console.log("User is logged in:", user);
        displayTasks();
    } else {
        console.log("No user logged in.");
    }
});

/* ------ Functions to handle form data and table data ------- */

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

    // Set the flag to true to prevent multiple submissions
    formSubmitted = true;

    // Extract form data
    const taskName = document.getElementById('taskName').value;
    const category = document.getElementById('category').value;
    const rawStartDate = document.getElementById('startDate').value;
    const startDateParts = rawStartDate.split('-');
    const formattedStartDate = `${startDateParts[1]}-${startDateParts[2]}-${startDateParts[0]}`; // Convert to MM-DD-YYYY format
    const interval = document.getElementById('interval').value;
    const description = document.getElementById('description').value;

    // Validate the start date format
    const datePattern = /^\d{2}-\d{2}-\d{4}$/;
    if (!datePattern.test(formattedStartDate)) {
        alert("Please enter the start date in the format MM-DD-YYYY.");
        formSubmitted = false;
        return;
    }

    // Take month, day, and year from the input field for start date
    const [startMonth, startDay, startYear] = formattedStartDate.split('-').map(Number);
    if (startMonth < 1 || startMonth > 12) {
        alert("Please enter a valid start month (1-12).");
        formSubmitted = false;
        return;
    }
    if (startDay < 1 || startDay > 31) {
        alert("Please enter a valid start day (1-31).");
        formSubmitted = false;
        return;
    }
    if (startYear < 1900 || startYear > 2100) {
        alert("Please enter a valid start year (1900-2100).");
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
            startDate: formattedStartDate,
            interval: interval,
            description: description
        });
        console.log("Document successfully written!");
        document.getElementById('addTaskForm').reset();
        document.getElementById('addTaskModal').close();
        displayTasks();

    } catch (error) {
        console.error("Error writing document: ", error);
    } finally {
        formSubmitted = false;
    }
}

function populateEditTaskModal(taskData) {
    const editTaskForm = document.getElementById('editTaskForm');
    
    editTaskForm.querySelector('#editTaskName').value = taskData.taskName;
    editTaskForm.querySelector('#editCategory').value = taskData.category;
    editTaskForm.querySelector('#editStartDate').valueAsDate = new Date(taskData.startDate);
    const intervalText = intervalTextMapping[taskData.interval] || taskData.interval;
    const editInterval = editTaskForm.querySelector('#editInterval');
    for (let option of editInterval.options) {
        if (option.text === intervalText) {
            option.selected = true;
            break;
        }
    }
    editTaskForm.querySelector('#editDescription').value = taskData.description;
}

// Function to update task data in Firestore and the table
async function updateTask(taskData, docRef, row) {
    try {
        await updateDoc(docRef, taskData);
        row.children[0].textContent = taskData.taskName;
        row.children[1].textContent = taskData.category;
        row.children[2].textContent = taskData.startDate;
        row.children[3].textContent = taskData.interval;
        row.children[4].textContent = taskData.description;

    } catch (error) {
        console.error("Error updating document: ", error);
    }
}

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

var lastFunction;

// Function to fetch and display task data from Firestore
async function displayTasks(sortByTaskName = false, sortByStartDate = false) {
    const user = auth.currentUser;
    if (!user) {
        return;
    }
    try {
        const taskTableBody = document.getElementById('taskTableBody');
        // Clear existing table rows
        taskTableBody.innerHTML = '';

        // Fetch task data associated with the logged-in user
        const querySnapshot = await getDocs(collection(firestore, `users/${user.uid}/tasks`));

        if (querySnapshot.empty) {
            // If no data - append a row with the message "No tasks entered yet if no data"
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="8" class="text-center py-4">No tasks entered yet</td>';
            taskTableBody.appendChild(emptyRow);
        } else {
            // Convert querySnapshot to an array of tasks
            const tasks = [];
            querySnapshot.forEach((doc) => {
                tasks.push({ id: doc.id, ...doc.data() });
            });

            // Sort tasks by name and startdate
            if (sortByTaskName) {
                tasks.sort((a, b) => a.taskName.localeCompare(b.taskName));
            } else if (sortByStartDate) {
                tasks.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
            }
            
            // Append each task as a row in the table
            tasks.forEach(task => {
                const row = document.createElement('tr');
                const intervalText = intervalTextMapping[task.interval] || task.interval;
                const taskColor = categoryColors[task.category] || '#3C3C3C';
                row.innerHTML = `
                    <td><a href="#" class="task-name-link" style="color: ${taskColor}">${task.taskName}</a></td>
                    <td>${task.category}</td>
                    <td>${task.startDate}</td>
                    <td>${intervalText}</td>
                    <td>${task.description}</td>
                    <td></td>
                    <td></td>
                `;
                document.getElementById('taskTableBody').appendChild(row);
            
                // Add event listener to the task name link
                const taskNameLink = row.querySelector('.task-name-link');
                taskNameLink.addEventListener('click', (event) => {
                    event.preventDefault();
                    showTaskDetailsModal(task);
                });

                // DaisyUI toggle switch for cell 6
                const toggleSwitchContainer = document.createElement('div');
                toggleSwitchContainer.classList.add('form-switch', 'flex', 'items-center');

                const toggleSwitchInput = document.createElement('input');
                toggleSwitchInput.type = 'checkbox';
                toggleSwitchInput.classList.add('toggle', 'toggle-success');
                toggleSwitchInput.checked = true;

                const toggleSwitchMark = document.createElement('span');
                toggleSwitchMark.classList.add('toggle-mark');

                toggleSwitchContainer.appendChild(toggleSwitchInput);
                toggleSwitchContainer.appendChild(toggleSwitchMark);

                row.children[5].appendChild(toggleSwitchContainer);

                // Flex container for icons in cell 7
                const iconsContainer = document.createElement('div');
                iconsContainer.classList.add('flex', 'items-center');

                // Anchor for pencil icon
                const editLink = document.createElement('a');
                editLink.href = '#';
                editLink.style.marginRight = '8px';
                iconsContainer.appendChild(editLink);

                // Font Awesome pencil icon
                const pencilIcon = document.createElement('i');
                pencilIcon.className = 'fas fa-pencil-alt';
                pencilIcon.classList.add('hover:text-marine', 'text-lg', 'mr-2');
                editLink.appendChild(pencilIcon);

                // Font Awesome garbage can icon
                const garbageIcon = document.createElement('i');
                garbageIcon.className = 'fas fa-trash-alt';
                garbageIcon.classList.add('hover:text-marine', 'text-lg', 'mr-2');
                garbageIcon.addEventListener('click', async () => {
                    // Ask for confirmation before deleting the task
                    const userConfirmed = confirm("Are you sure you want to delete this task?");
                    
                    if (userConfirmed) {
                        try {
                            // Capture the doc reference for deletion
                            const docRef = doc(collection(firestore, `users/${user.uid}/tasks`), task.id);
                
                            // Delete the document from Firestore
                            await deleteDoc(docRef);
                
                            // Remove the row from the table
                            taskTableBody.removeChild(row);
                
                            console.log("Task deleted successfully.");
                        } catch (error) {
                            console.error("Error deleting document: ", error);
                        }
                    }
                });

                iconsContainer.appendChild(garbageIcon);
                row.children[6].appendChild(iconsContainer);

                // Add event listener to the pencil icon
                pencilIcon.addEventListener('click', async () => {
                    const taskData = {
                        taskName: row.children[0].textContent,
                        category: row.children[1].textContent,
                        startDate: row.children[2].textContent,
                        interval: row.children[3].textContent,
                        description: row.children[4].textContent
                    };
                    // Populate the edit task modal with data from the corresponding row
                    populateEditTaskModal(taskData);
                    document.getElementById('editTaskModal').showModal();

                    // Add event listener to the submit button on the edit task form
                    const editTaskForm = document.getElementById('editTaskForm');

                    if (lastFunction !== undefined) {
                        editTaskForm.removeEventListener('submit', lastFunction);
                        console.log("remove");
                    }

                    lastFunction = async (e) => {
                        e.preventDefault();

                        // Extract edited task data
                        const editedTaskData = {
                            taskName: editTaskForm.querySelector('#editTaskName').value,
                            category: editTaskForm.querySelector('#editCategory').value,
                            startDate: editTaskForm.querySelector('#editStartDate').value,
                            interval: editTaskForm.querySelector('#editInterval').value,
                            description: editTaskForm.querySelector('#editDescription').value
                        };

                        // Update task data in Firestore and the table
                        const docRef = doc(collection(firestore, `users/${user.uid}/tasks`), task.id);
                        await updateTask(editedTaskData, docRef, row);
                        document.getElementById('editTaskModal').close();
                        displayTasks();
                    }
                    
                    editTaskForm.addEventListener('submit', lastFunction);
                });

                taskTableBody.appendChild(row);

            });
        }
    } catch (error) {
        console.error("Error fetching tasks: ", error);
    }
}

displayTasks();

/* -------- Functions to handle modal functionality ------- */

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

// Function to initialize modals after loading
function initializeModals() {
    var addTaskModal = document.getElementById('addTaskModal');
    var editTaskModal = document.getElementById('editTaskModal');

    if (addTaskModal && editTaskModal) {
        document.getElementById('addTaskButton').addEventListener('click', function() {
            addTaskModal.showModal();
        });

        document.getElementById('submitTaskButton').addEventListener('click', function() {
                saveFormData();
        });
    }}

// Function to show the add task modal
function showAddTaskModal() {
    var addTaskModal = document.getElementById('addTaskModal');
    if (addTaskModal) {
        addTaskModal.showModal();
    }
}

// Function to show task details modal with task data
function showTaskDetailsModal(task) {
    const taskDetailsModal = document.getElementById('taskDetailsModal');
    if (taskDetailsModal) {
        // Populate modal with task data
        document.getElementById('taskDetailsName').textContent = task.taskName;
        document.getElementById('taskDetailsCategory').textContent = task.category;
        document.getElementById('taskDetailsStartDate').textContent = task.startDate;
        document.getElementById('taskDetailsInterval').textContent = `${task.interval} days`;
        document.getElementById('taskDetailsDescription').textContent = task.description;

        taskDetailsModal.showModal();
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

// Add event listener to task name header to sort tasks when clicked
document.getElementById('taskNameHeader').addEventListener('click', () => {
    const sortButton = document.getElementById('sortTasksButton');
    const isDescending = sortButton.innerHTML === '▼';

    if (isDescending) {
        sortButton.innerHTML = '▲';
    } else {
        sortButton.innerHTML = '▼';
    }

    displayTasks(!isDescending);
});

// Add event listener to start date header to sort tasks by start date when clicked
document.getElementById('startDateHeader').addEventListener('click', () => {
    const sortButton = document.getElementById('sortTasksByStartDateButton');
    const isDescending = sortButton.innerHTML === '▼';

    if (isDescending) {
        sortButton.innerHTML = '▲';
    } else {
        sortButton.innerHTML = '▼';
    }
    displayTasks(false, !isDescending);
});

/* ---- Firbase Auth Sign Out JS ----- */

// Function to sign out the user
function signOutUser() {
    signOut(auth)
        .then(() => {
            window.location.href = "index.html";
        })
        .catch((error) => {
            console.error("Error signing out: ", error);
        });
}

// Add event listener to the sign out link
document.getElementById('signOutLink').addEventListener('click', function(event) {
    event.preventDefault();
    signOutUser();
});