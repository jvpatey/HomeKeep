function scheduleNotification(date, message) {
    var currentDate = new Date();
    var scheduledDate = new Date(date);

    var timeDifference = scheduledDate.getTime() - currentDate.getTime();

    if (timeDifference > 0) {
        setTimeout(function() {
            // Request permission for browser notifications
            Notification.requestPermission().then(function(permission) {
                if (permission === 'granted') {
                    // Create a new notification
                    var notification = new Notification('Scheduled Notification', {
                        body: message,
                        icon: 'https://example.com/icon.png' // URL to an icon for the notification
                    });
                } else {
                    console.log('Notification permission denied');
                }
            });
        }, timeDifference);
    } else {
        console.log('Invalid scheduled date');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Example usage:
    var scheduledDate = new Date("03-27-2024T19:53:00"); // Example scheduled date
    var message = "This is a scheduled notification!";
    scheduleNotification(scheduledDate, message);
			
    var formData = JSON.parse(localStorage.getItem('formData')) || [];
    
    // Event listener for the "+" button to open the add task modal
    var addTaskButton = document.getElementById('addTaskButton');
    var addTaskModal = document.getElementById('addTaskModal');

    if (addTaskButton && addTaskModal) {
        addTaskButton.addEventListener('click', function() {
            addTaskModal.showModal();
        });
    }

// Event listener for the edit task form
var editSubmitBtn = document.getElementById('editSubmitBtn');

if (editSubmitBtn) {
    editSubmitBtn.addEventListener('click', function() {
        var updatedTask = document.getElementById('editTaskName').value;
        var updatedCategory = document.getElementById('editCategory').value;
        var updatedStartDate = document.getElementById('editStartDate').value;
        var updatedInterval = document.getElementById('editInterval').value;
        var updatedDescription = document.getElementById('editDescription').value;

        var rowIndex = localStorage.getItem('editTaskRowIndex');

        var existingData = JSON.parse(localStorage.getItem('formData'));

        if (existingData && Array.isArray(existingData)) {
            existingData[rowIndex] = {
                task: updatedTask,
                category: updatedCategory,
                startDate: updatedStartDate,
                interval: updatedInterval,
                description: updatedDescription
            };

            localStorage.setItem('formData', JSON.stringify(existingData));

            // Update the displayed table
            displayFormData();

            // Close the edit modal
            var editTaskModal = document.getElementById('editTaskModal');
            if (editTaskModal) {
                editTaskModal.close();
            }
        }
    });
}
    // Display form data on dashboard
    if (document.getElementById("taskTable")) {
        displayFormData();
    }
});

// Function to open the edit task modal when pencil icon is clicked and populate the fields
function openEditTaskModal() {
    var editTaskModal = document.getElementById('editTaskModal');
    if (editTaskModal) {

        var rowData = JSON.parse(localStorage.getItem('editTaskData'));
        console.log('Row data:', rowData);
        
        if (rowData) {
            document.getElementById('editTaskName').value = rowData.task || '';
            document.getElementById('editCategory').value = rowData.category || '';
            document.getElementById('editStartDate').value = rowData.startDate || '';
            document.getElementById('editInterval').value = rowData.interval || '';
            document.getElementById('editDescription').value = rowData.description || '';
        }
        editTaskModal.showModal();
    }
};

// Function to save form from "add a task" table
function saveFormData() {
    var task = document.getElementById("taskName").value;
    var category = document.getElementById("category").value;
    var startDate = document.getElementById("startDate").value;
    var interval = document.getElementById("interval").value;
    var description = document.getElementById("description").value;

    // Validate the start date format
    var dateRegex = /^\d{2}-\d{2}-\d{4}$/;
    if (!dateRegex.test(startDate)) {
        alert("Please enter the start date in the format MM-DD-YYYY.");
        return;
    }

    // Extract month, day, and year from the start date
    var parts = startDate.split('-');
    var month = parseInt(parts[0], 10);
    var day = parseInt(parts[1], 10);
    var year = parseInt(parts[2], 10);

    // Validate month range
    if (month < 1 || month > 12) {
        alert("Invalid month. Please enter a month between 01 and 12.");
        return;
    }

    // Validate day range based on the month
    var daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) {
        alert("Invalid day for the specified month. Please enter a valid day.");
        return;
    }

    var existingData = JSON.parse(localStorage.getItem('formData')) || [];

    existingData.push({ task: task, category: category, startDate: startDate, interval: interval, description: description });
    localStorage.setItem('formData', JSON.stringify(existingData));

    // Determine the destination page based on the current URL
    var currentPage = window.location.pathname;
    var destinationPage;

    if (currentPage.includes("dashboard-calendar.html")) {
        destinationPage = "dashboard-calendar.html";
    } else {
        destinationPage = "dashboard.html";
    }

    window.location.href = destinationPage;
}

// Function to retrieve the data from storage to display it in the dashboard table
function displayFormData() {
    var formData = JSON.parse(localStorage.getItem('formData'));
    var tableBody = document.getElementById('taskTableBody');

    tableBody.innerHTML = '';

    if (formData && formData.length > 0) {
        formData.forEach((entry, index) => {
            addToTable(entry.task, entry.category, entry.startDate, entry.interval, entry.description, index);
        });
    } else {
        var emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="7" class="text-center">No tasks added yet</td>';
        tableBody.appendChild(emptyRow);
    }
}

// function to add or update a row in the dashboard table with the retrieved data
function addToTable(task, category, startDate, interval, description, index) {
    var table = document.getElementById("taskTable");
    var tbody = table.querySelector('tbody');

    // Check if the task already exists in the table
    var existingRow = document.getElementById('task_' + index);
    if (existingRow) {
        // If the task exists, update the row
        var cells = existingRow.querySelectorAll('td');
        cells[0].textContent = task;
        cells[1].textContent = category;
        cells[2].textContent = startDate;
        cells[3].textContent = interval;
        cells[4].textContent = description;
    } else {
        // If the task does not exist, add a new row
        var newRow = tbody.insertRow(-1);
        newRow.id = 'task_' + index;

        var cell1 = newRow.insertCell(0);
        var cell2 = newRow.insertCell(1);
        var cell3 = newRow.insertCell(2);
        var cell4 = newRow.insertCell(3);
        var cell5 = newRow.insertCell(4);
        var cell6 = newRow.insertCell(5);
        var cell7 = newRow.insertCell(6);

        cell1.textContent = task;
        cell2.textContent = category;
        cell3.textContent = startDate;
        cell4.textContent = interval;
        cell5.textContent = description;

        // DaisyUI toggle switch for cell 6
        var toggleSwitchContainer = document.createElement('div');
        toggleSwitchContainer.classList.add('form-switch', 'flex', 'items-center'); // Removed 'justify-center'

        var toggleSwitchInput = document.createElement('input');
        toggleSwitchInput.type = 'checkbox';
        toggleSwitchInput.classList.add('toggle', 'toggle-success');
        toggleSwitchInput.checked = true;

        var toggleSwitchMark = document.createElement('span');
        toggleSwitchMark.classList.add('toggle-mark');

        toggleSwitchContainer.appendChild(toggleSwitchInput);
        toggleSwitchContainer.appendChild(toggleSwitchMark);

        cell6.appendChild(toggleSwitchContainer);


        // Flex container for icons in cell 7
        var iconsContainer = document.createElement('div');
        iconsContainer.classList.add('flex', 'items-center');

        // Anchor for pencil icon
        var editLink = document.createElement('a');
        editLink.href = '#';
        editLink.style.marginRight = '8px';
        iconsContainer.appendChild(editLink);

        // Font Awesome pencil icon
        var pencilIcon = document.createElement('i');
        pencilIcon.className = 'fas fa-pencil-alt';
        pencilIcon.classList.add('hover:text-orange');
        editLink.appendChild(pencilIcon);

        // Font Awesome garbage can icon
        var garbageIcon = document.createElement('i');
        garbageIcon.className = 'fas fa-trash-alt';
        garbageIcon.classList.add('hover:text-orange');
        iconsContainer.appendChild(garbageIcon);
        cell7.appendChild(iconsContainer);

        pencilIcon.style.marginRight = '10px';

        // adding delete functionality to garbage can icon
        garbageIcon.addEventListener('click', function() {
            deleteTask(index);
        });

        // adding edit functionality to pencil icon
        pencilIcon.addEventListener('click', function(event) {
            var rowData = {
                task: task,
                category: category,
                startDate: startDate,
                interval: interval,
                description: description
            };
            localStorage.setItem('editTaskData', JSON.stringify(rowData));
            localStorage.setItem('editTaskRowIndex', index);
        
            // Clear previously deleted task data
            localStorage.removeItem('deletedTaskData');
            localStorage.removeItem('deletedTaskRowIndex');
        
            openEditTaskModal();
        
            // Prevent default anchor behavior
            event.preventDefault();
        });
    }
}

// Function to delete a task
function deleteTask(index) {
    var formData = JSON.parse(localStorage.getItem('formData')) || [];
    formData.splice(index, 1);
    localStorage.setItem('formData', JSON.stringify(formData));
    displayFormData();
}

// Function to edit a task
function editTask(index) {
    var rowData = JSON.parse(localStorage.getItem('formData'))[index];
    localStorage.setItem('editTaskData', JSON.stringify(rowData));
    localStorage.setItem('editTaskRowIndex', index.toString());

    // Redirect back to dashboard after editing
    window.location.href = 'dashboard.html';
}

// Function to show the help request modal
function showHelpModal() {
    var helpModal = document.getElementById('helpRequestModal');
    if (helpModal) {
        helpModal.showModal();
    }
};

// function for drop down menu in navbar
function toggleDropdown() {
    var dropdownMenu = document.getElementById("dropdownMenu");
    dropdownMenu.classList.toggle("hidden")
    };

//function to show create account modal
function showCreateAccountModal() {
    var modal = document.getElementById('createAccountModal');
    if (modal) {
        modal.showModal();
    }
}

// function to close create account modal
function closeCreateAccountModal() {
    var modal = document.getElementById('createAccountModal');
    modal.close();
}

// function to show login modal
function showLoginModal() {
    var loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.showModal();
    }
}

// function to close login modal
function closeLoginModal() {
    var loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.close();
    }
}