/* ------ Firebase Initialization ------- */

// Import Firebase, Firestore, Auth
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js'
import { getFirestore, collection, doc, addDoc, getDocs, deleteDoc, updateDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js'
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
const messagesCollection = collection(firestore, 'messages');
const responsesCollection = collection(firestore, 'responses'); // New collection reference

// Check authentication status
console.log(auth.currentUser);

// Handle authentication state changes
auth.onAuthStateChanged(user => {
    if (user) {
        console.log("User is logged in:", user);
        displayTasks();
    } else {
        console.log("No user logged in.");
    }
});

/* ----- Firebase messages via chat ----- */

// Function to send a message to Firestore
async function sendMessage(message) {
    try {
        await addDoc(messagesCollection, {
            sender: 'user', // You can replace 'user' with any identifier for the sender
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
        sendMessage(message); // Call sendMessage function
        messageInput.value = '';
    }
}

/* ------ Functions to handle form data and table data ------- */

let formSubmitted = false;

// Function to save task data to Firestore
async function saveFormData() {
    // Check if the form has already been submitted
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
    const rawStartDate = document.getElementById('startDate').value; // Get raw date value
    const startDateParts = rawStartDate.split('-'); // Split into parts
    const formattedStartDate = `${startDateParts[1]}-${startDateParts[2]}-${startDateParts[0]}`; // Convert to MM-DD-YYYY format
    const interval = document.getElementById('interval').value;
    const description = document.getElementById('description').value;

    // Validate the start date format
    const datePattern = /^\d{2}-\d{2}-\d{4}$/;
    if (!datePattern.test(formattedStartDate)) {
        alert("Please enter the start date in the format MM-DD-YYYY.");
        // Reset the flag to allow resubmission
        formSubmitted = false;
        return;
    }

    // Take month, day, and year from the input
    const [month, day, year] = formattedStartDate.split('-').map(Number);
    if (month < 1 || month > 12) {
        alert("Please enter a valid month (1-12).");
        // Reset the flag to allow resubmission
        formSubmitted = false;
        return;
    }
    if (day < 1 || day > 31) {
        alert("Please enter a valid day (1-31).");
        // Reset the flag to allow resubmission
        formSubmitted = false;
        return;
    }
    if (year < 1900 || year > 2100) {
        alert("Please enter a valid year (1900-2100).");
        // Reset the flag to allow resubmission
        formSubmitted = false;
        return;
    }

    try {
        // Add a new document with a generated ID and user's authentication information
        await addDoc(collection(firestore, `users/${user.uid}/tasks`), {
            taskName: taskName,
            category: category,
            startDate: formattedStartDate, // Use formatted start date
            interval: interval,
            description: description
        });
        console.log("Document successfully written!");
        // Reset form and close modal
        document.getElementById('addTaskForm').reset();
        document.getElementById('addTaskModal').close();
        // Call displayTasks to update the table with the new task
        displayTasks();
    } catch (error) {
        console.error("Error writing document: ", error);
    } finally {
        // Reset the flag after the operation is complete
        formSubmitted = false;
    }
}

// Add event listener for submit button on add task form
document.addEventListener('click', function(event) {
    if (event.target && event.target.id === 'submitTaskButton') {
        saveFormData();
    }
});


// Function to populate the edit task modal with data from the corresponding row
function populateEditTaskModal(taskData) {
    var editTaskForm = document.getElementById('editTaskForm');
    editTaskForm.querySelector('#editTaskName').value = taskData.taskName;
    editTaskForm.querySelector('#editCategory').value = taskData.category;
    editTaskForm.querySelector('#editStartDate').value = taskData.startDate;
    editTaskForm.querySelector('#editInterval').value = taskData.interval;
    editTaskForm.querySelector('#editDescription').value = taskData.description;
}

// Function to update task data in Firestore and the table
async function updateTask(taskData, docRef, row) {
    try {
        // Update document in Firestore and table
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

// Function to fetch and display task data from Firestore
async function displayTasks(sortByTaskName = false, sortByStartDate = false) {
    // Get the currently logged-in user
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
            // Append a row with the message "No tasks entered yet"
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="7" class="text-center py-4">No tasks entered yet</td>';
            taskTableBody.appendChild(emptyRow);
        } else {
            // Convert querySnapshot to an array of tasks
            const tasks = [];
            querySnapshot.forEach((doc) => {
                tasks.push({ id: doc.id, ...doc.data() });
            });

            // Sort tasks by name and start date
            if (sortByTaskName) {
                tasks.sort((a, b) => a.taskName.localeCompare(b.taskName));
            } else if (sortByStartDate) {
                tasks.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
            }

            // Append each task as a row to the table
            tasks.forEach(task => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${task.taskName}</td>
                    <td>${task.category}</td>
                    <td>${task.startDate}</td>
                    <td>${task.interval}</td>
                    <td>${task.description}</td>
                    <td></td>
                    <td></td>
                `;

                // DaisyUI toggle switch for cell 5
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

                // Flex container for icons in cell 6
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
                pencilIcon.classList.add('hover:text-orange');
                editLink.appendChild(pencilIcon);

                // Font Awesome garbage can icon
                const garbageIcon = document.createElement('i');
                garbageIcon.className = 'fas fa-trash-alt';
                garbageIcon.classList.add('hover:text-orange');
                garbageIcon.addEventListener('click', async () => {
                    try {
                        // Capture the doc reference for deletion
                        const docRef = doc(collection(firestore, `users/${user.uid}/tasks`), task.id);
                        // Delete document from Firestore
                        await deleteDoc(docRef);
                        // Remove row from table
                        taskTableBody.removeChild(row);
                    } catch (error) {
                        console.error("Error deleting document: ", error);
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
                    editTaskForm.addEventListener('submit', async (e) => {
                        e.preventDefault();

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
                    });
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
    var chatForm = document.getElementById('chatForm'); // Get the chatForm

    if (addTaskModal && editTaskModal && chatForm) {
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
        chatModal.style.display = "none"; // Close the modal
    } else {
        chatModal.style.display = "block"; // Open the modal
    }
}

const testNotificationApi = () => {
    fetch("http://127.0.0.1:5001/homekeep-x/us-central1/notify");
}


// Add event listeners to show modals
document.getElementById('addTaskButton').addEventListener('click', showAddTaskModal);
document.getElementById("chatIcon").addEventListener("click", toggleChatModal)
document.getElementById('testButton').addEventListener('click', testNotificationApi);

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
