/* ------ Firebase Initialization ------- */

// Import Firebase, Firestore, Auth
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js'
import { getFirestore, collection, doc, addDoc, getDoc, setDoc, getDocs, deleteDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js'
import { getAuth, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js';

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

// Check if user is signed in and redirect if not
onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("User is logged in:", user);
      displayTasks();
    } else {
      console.log("No user logged in.");
      // Redirect to login page or index.html if no user is logged in
      window.location.href = "index.html";
      console.log("redirected to index.html - no user logged in.")
      alert("Please log in to access this page.")
    }
  });

/* ------ Functions to handle form data and table data ------- */

let formSubmitted = false;

// function to save data from add task form and add it to firestore db
async function saveFormData() {
    if (formSubmitted) {
        return;
    }

    // get current user
    const user = auth.currentUser;
    if (!user) {
        console.error("No user logged in.");
        return;
    }

    // Set the flag to true to prevent multiple form submissions
    formSubmitted = true;

    // Extract form data
    const taskName = document.getElementById('taskName').value;
    const category = document.getElementById('category').value;
    const rawStartDate = document.getElementById('startDate').value;
    const startDateParts = rawStartDate.split('-');
    const formattedStartDate = `${startDateParts[1]}-${startDateParts[2]}-${startDateParts[0]}`;
    const interval = document.getElementById('interval').value;
    const description = document.getElementById('description').value;

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
};

// convert date to ISO standard
function convertToISO(date) {
    const dateParts = date.split('-');
    const month = dateParts[0];
    const day = dateParts[1];
    const year = dateParts[2];
    return `${year}-${month}-${day}`;
};

// function to populate edit task modal with row data
function populateEditTaskModal(taskData) {
    const editTaskForm = document.getElementById('editTaskForm');
    
    editTaskForm.querySelector('#editTaskName').value = taskData.taskName;
    editTaskForm.querySelector('#editCategory').value = taskData.category;

    const isoDate = convertToISO(taskData.startDate);
    editTaskForm.querySelector('#editStartDate').value = isoDate;

    const intervalText = intervalTextMapping[taskData.interval] || taskData.interval;
    const editInterval = editTaskForm.querySelector('#editInterval');
    for (let option of editInterval.options) {
        if (option.text === intervalText) {
            option.selected = true;
            break;
        }
    }

    editTaskForm.querySelector('#editDescription').value = taskData.description;
};

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
};

// assigning colors to task categories
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

// Mapping from interval value to display text versions
const intervalTextMapping = {
    "1": "Daily",
    "7": "Weekly",
    "14": "Bi-Weekly",
    "30": "Monthly",
    "90": "Quarterly",
    "180": "Bi-Annually",
    "365": "Annually",
};

/* ----- Displaying table data ----- */

var lastFunction;

// Function to fetch and display task data from Firestore
async function displayTasks(sortByTaskName = false, sortByStartDate = false, sortByCategory = false) {
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
            emptyRow.innerHTML = '<td colspan="8" id="emptyRow" class="text-center py-4">No tasks entered yet</td>';
            taskTableBody.appendChild(emptyRow);
        } else {
            // Convert querySnapshot to an array of tasks
            const tasks = [];
            querySnapshot.forEach((doc) => {
                tasks.push({ id: doc.id, ...doc.data() });
            });

            // Sorting logic
            if (sortByTaskName) {
                tasks.sort((a, b) => a.taskName.localeCompare(b.taskName));
            } else if (sortByStartDate) {
                tasks.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
            } else if (sortByCategory) {
                tasks.sort((a, b) => a.category.localeCompare(b.category));
            }
            
            // Append each task as a row in the table
            tasks.forEach(task => {
                const row = document.createElement('tr');
                const intervalText = intervalTextMapping[task.interval] || task.interval;
                const taskColor = categoryColors[task.category] || '#3C3C3C';
                row.innerHTML = `
                    <td><a href="#" class="task-name-link font-bold" style="color: ${taskColor}">${task.taskName}</a></td>
                    <td>${task.category}</td>
                    <td>${task.startDate}</td>
                    <td>${intervalText}</td>
                    <td>${task.description}</td>
                    <td></td>
                `;
                document.getElementById('taskTableBody').appendChild(row);
            
                // Add event listener to the task name link to show task details modal
                const taskNameLink = row.querySelector('.task-name-link');
                taskNameLink.addEventListener('click', (event) => {
                    event.preventDefault();
                    showTaskDetailsModal(task);
                });

                // Flex container for icons
                const iconsContainer = document.createElement('div');
                iconsContainer.classList.add('flex', 'items-center');

                // Anchor for pencil icon
                const editLink = document.createElement('a');
                editLink.href = '#';
                editLink.style.marginRight = '8px';
                iconsContainer.appendChild(editLink);

                // Generating pencil icon
                const pencilIcon = document.createElement('i');
                pencilIcon.className = 'fas fa-pencil-alt';
                pencilIcon.classList.add('bg-marine', 'px-2', 'py-1', 'text-paper', 'dark:text-slate', 'rounded-lg', 'hover:bg-feather', 'text-lg', 'mr-2');
                editLink.appendChild(pencilIcon);

                // Generating garbagecan icon
                const garbageIcon = document.createElement('i');
                garbageIcon.className = 'fas fa-trash-alt';
                garbageIcon.classList.add('bg-marine', 'px-2.5', 'py-1', 'text-paper', 'dark:text-slate', 'rounded-lg', 'hover:bg-feather', 'text-lg', 'mr-2');

                // event listener for garbagecan icon
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

                            // Add the empty row if no tasks remain
                            if (taskTableBody.childElementCount === 0) {
                                const emptyRow = document.createElement('tr');
                                emptyRow.innerHTML = '<td colspan="8" id="emptyRow" class="text-center py-4">No tasks entered yet</td>';
                                taskTableBody.appendChild(emptyRow);
                            }
                
                            console.log("Task deleted successfully.");
                        } catch (error) {
                            console.error("Error deleting document: ", error);
                        }
                    }
                });

                iconsContainer.appendChild(garbageIcon);
                row.children[5].appendChild(iconsContainer);

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
                    const editTaskForm = document.getElementById('editTaskForm');

                    if (lastFunction !== undefined) {
                        editTaskForm.removeEventListener('submit', lastFunction);
                        console.log("remove");
                    }

                    lastFunction = async (e) => {
                        e.preventDefault();
                    
                        const rawStartDate = editTaskForm.querySelector('#editStartDate').value;
                        const isoDateParts = rawStartDate.split('-');
                        const formattedStartDate = `${isoDateParts[1]}-${isoDateParts[2]}-${isoDateParts[0]}`; // MM-DD-YYYY
                    
                        const editedTaskData = {
                            taskName: editTaskForm.querySelector('#editTaskName').value,
                            category: editTaskForm.querySelector('#editCategory').value,
                            startDate: formattedStartDate, // Store in MM-DD-YYYY format
                            interval: editTaskForm.querySelector('#editInterval').value,
                            description: editTaskForm.querySelector('#editDescription').value,
                        };
                    
                        const docRef = doc(collection(firestore, `users/${user.uid}/tasks`), task.id);
                        await updateTask(editedTaskData, docRef, row);
                        document.getElementById('editTaskModal').close();
                        displayTasks();
                    };
                    // Add event listener to the submit button on the edit task form
                    editTaskForm.addEventListener('submit', lastFunction);
                });
                taskTableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error("Error fetching tasks: ", error);
    }
};

displayTasks();

/* -------- Functions to handle modals ------- */

// Function to load modal content from modals.html and initialize modals
function loadModals() {
    fetch('modals.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(html => {
            document.body.insertAdjacentHTML('beforeend', html);
            
            // Setup Add Task Modal event listener
            const addTaskModal = document.getElementById('addTaskModal');
            if (addTaskModal) {
                document.getElementById('addTaskButton').addEventListener('click', function() {
                    addTaskModal.showModal();
                });
                document.getElementById('submitTaskButton').addEventListener('click', function() {
                    saveFormData();
                });
            }

            // Hide edit/delete buttons on task details modal for table page
            const isTablePage = true;
            const editTaskButton = document.getElementById('editTaskButton');
            const deleteTaskButton = document.getElementById('deleteTaskButton');

            if (isTablePage) {
                if (editTaskButton) {
                    editTaskButton.style.display = 'none';
                }
                if (deleteTaskButton) {
                    deleteTaskButton.style.display = 'none';
                }
            }
        })
        .catch(error => {
            console.error('Error fetching modal content:', error);
        });
}

// Function to show the add task modal
function showAddTaskModal() {
    var addTaskModal = document.getElementById('addTaskModal');
    if (addTaskModal) {
        addTaskModal.showModal();
    }
}

// function to show the task details modal
function showTaskDetailsModal(task) {
    const taskDetailsModal = document.getElementById('taskDetailsModal');
    if (taskDetailsModal) {
        // Populate the modal with task data
        document.getElementById('taskDetailsName').textContent = task.taskName;
        document.getElementById('taskDetailsCategory').textContent = task.category;
        document.getElementById('taskDetailsStartDate').textContent = task.startDate;
        const intervalText = intervalTextMapping[task.interval] || 'Unknown Interval';
        document.getElementById('taskDetailsInterval').textContent = intervalText;
        document.getElementById('taskDetailsDescription').textContent = task.description;

        taskDetailsModal.showModal();
    }
}

// Add event listeners to show modals
document.getElementById('addTaskButton').addEventListener('click', showAddTaskModal);
document.addEventListener('DOMContentLoaded', function() {
    loadModals();
});

/* ----- Sorting functionality for table ----- */

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

// Add event listener to category header to sort tasks by category when clicked
document.getElementById('categoryHeader').addEventListener('click', () => {
    const sortButton = document.getElementById('sortTasksByCategoryButton');
    const isDescending = sortButton.innerHTML === '▼';

    if (isDescending) {
        sortButton.innerHTML = '▲';
    } else {
        sortButton.innerHTML = '▼';
    }

    displayTasks(false, false, !isDescending);
});

/* -----  Help request pop up handling ----- */

// function to toggle open/close of modal when icon is clicked
function toggleChatModal() {
    var chatModal = document.getElementById("chatModal");
    if (chatModal.style.display === "block") {
        chatModal.style.display = "none";
    } else {
        chatModal.style.display = "block";
    }
}

// Close the chat modal if clicked outside the window
document.addEventListener('click', function(event) {
    const chatModal = document.getElementById("chatModal");
    const isClickInside = chatModal.contains(event.target);

    if (!isClickInside && chatModal.style.display === "block") {
        chatModal.style.display = "none";
    }
});

// Ensure the chat modal toggle doesn't close when clicking inside
document.getElementById("chatIcon").addEventListener("click", function(event) {
    event.stopPropagation();
    toggleChatModal();
});

/* ----- Dark Mode functionality ----- */

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

/* ----- Firbase Auth Sign Out JS ----- */

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