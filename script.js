/* ------ Firebase Initialization ------- */

// Import Firebase, Firestore, Auth
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js'
import { getFirestore, collection, addDoc, getDocs, deleteDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js'
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
console.log(auth.currentUser);

// Handle authentication state changes
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in.
        console.log("User is logged in:", user);
        // Call any necessary functions here
        displayTasks(); // Example: Call function to display tasks
    } else {
        // No user is signed in.
        console.log("No user logged in.");
        // Perform any necessary actions for when no user is logged in
    }
});


/* ------ Functions to handle form data and table data ------- */

// Function to save task data to Firestore
async function saveFormData() {
    // Get the currently logged-in user
    const user = auth.currentUser;

    if (!user) {
        console.error("No user logged in.");
        return;
    }

    // Extract form data
    const taskName = document.getElementById('taskName').value;
    const category = document.getElementById('category').value;
    const startDate = document.getElementById('startDate').value;
    const interval = document.getElementById('interval').value;
    const description = document.getElementById('description').value;

    // Validate the start date format
    const datePattern = /^\d{2}-\d{2}-\d{4}$/;
    if (!datePattern.test(startDate)) {
        alert("Please enter the start date in the format MM-DD-YYYY.");
        return;
    }

    // Extract month, day, and year from the input
    const [month, day, year] = startDate.split('-').map(Number);
    if (month < 1 || month > 12) {
        alert("Please enter a valid month (1-12).");
        return;
    }
    if (day < 1 || day > 31) {
        alert("Please enter a valid day (1-31).");
        return;
    }
    if (year < 1900 || year > 2100) {
        alert("Please enter a valid year (1900-2100).");
        return;
    }

    try {
        // Add a new document with a generated ID and user's authentication information
        await addDoc(collection(firestore, `users/${user.uid}/tasks`), {
            taskName: taskName,
            category: category,
            startDate: startDate,
            interval: interval,
            description: description
        });
        console.log("Document successfully written!");
        // Reset form and close modal
        document.getElementById('addTaskForm').reset();
        document.getElementById('addTaskModal').close();
        // Refresh task display
        displayTasks();
    } catch (error) {
        console.error("Error writing document: ", error);
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
async function displayTasks() {
    
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
            emptyRow.innerHTML = '<td colspan="7" class="text-center py-4 text-grey">No tasks entered yet</td>';
            taskTableBody.appendChild(emptyRow);
        } else {
            // Append each task as a row to the table
            querySnapshot.forEach((doc) => {
                const task = doc.data();
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

                // DaisyUI toggle switch for cell 6
                const toggleSwitchContainer = document.createElement('div');
                toggleSwitchContainer.classList.add('form-switch', 'flex', 'items-center'); // Removed 'justify-center'

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
                pencilIcon.classList.add('hover:text-orange');
                editLink.appendChild(pencilIcon);

                // Font Awesome garbage can icon
                const garbageIcon = document.createElement('i');
                garbageIcon.className = 'fas fa-trash-alt';
                garbageIcon.classList.add('hover:text-orange');
                garbageIcon.addEventListener('click', async () => {
                    try {
                        // Delete document from Firestore
                        await deleteDoc(doc.ref);
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
                        await updateTask(editedTaskData, doc.ref, row);
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

// Function for toggling the dropdown menu in the navbar
function toggleDropdown() {
    var dropdownMenu = document.getElementById("dropdownMenu");
    dropdownMenu.classList.toggle("hidden");
}

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
    var helpModal = document.getElementById('helpModal');

    if (addTaskModal && editTaskModal && helpModal) {
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

// Function to show the edit task modal
function showEditTaskModal() {
    var editTaskModal = document.getElementById('editTaskModal');
    if (editTaskModal) {
        editTaskModal.showModal();
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
