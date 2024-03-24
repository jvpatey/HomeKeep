// function to save form from "add a task" table
function saveFormData() {
    var task = document.getElementById("taskName").value;
    var category = document.getElementById("category").value;
    var startDate = document.getElementById("startDate").value;
    var interval = document.getElementById("interval").value;
    var description = document.getElementById("description").value;

    var existingData = JSON.parse(localStorage.getItem('formData'));

    if (!Array.isArray(existingData)) {
        existingData = [];
    }

    existingData.push({ task: task, category: category, startDate: startDate, interval: interval, description: description});
    localStorage.setItem('formData', JSON.stringify(existingData));
    window.location.href = 'dashboard.html';

    };

document.addEventListener('DOMContentLoaded', function() {
    displayFormData();

    // Function to retrieve the data from storage to display it in the dashboard table, checking for deleted data in local storage and skipping that if necessary
    function displayFormData() {
        var formData = JSON.parse(localStorage.getItem('formData'));
        var deletedRowData = JSON.parse(localStorage.getItem('deletedTaskData'));
        var deletedRowIndex = localStorage.getItem('deletedTaskRowIndex');
        var tableBody = document.getElementById('taskTableBody');

        // Clear table body
        tableBody.innerHTML = '';

        if (formData && formData.length > 0) {
            formData.forEach((entry, index) => {
                // Skip deleted rows
                if (index.toString() === deletedRowIndex && JSON.stringify(entry) === deletedRowData) {
                    return;
                }

                addToTable(entry.task, entry.category, entry.startDate, entry.interval, entry.description);
            });
        } else {
            var emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="7" class="text-center">No tasks added yet</td>';
            tableBody.appendChild(emptyRow);
        }
    }
});

// function to add a new row to existing dashboard table with the retrieved data
function addToTable(task, category, startDate, interval, description) {
    var table = document.getElementById("taskTable");
    var tbody = table.querySelector('tbody');
    var rows = tbody.querySelectorAll('tr');

    // Check if the task already exists in the table
    for (var i = 0; i < rows.length; i++) {
        var cells = rows[i].querySelectorAll('td');
        if (cells[0].textContent === task) {
            // If the task exists, update the row
            cells[1].textContent = category;
            cells[2].textContent = startDate;
            cells[3].textContent = interval;
            cells[4].textContent = description;
            return;
        }
    }

    // If the task does not exist, add a new row
    var newRow = tbody.insertRow(-1);

    var cell1 = newRow.insertCell(0);
    var cell2 = newRow.insertCell(1);
    var cell3 = newRow.insertCell(2);
    var cell4 = newRow.insertCell(3);
    var cell5 = newRow.insertCell(4);
    var cell6 = newRow.insertCell(5);
    var cell7 = newRow.insertCell(6);

    cell1.innerHTML = task;
    cell2.innerHTML = category;
    cell3.innerHTML = startDate;
    cell4.innerHTML = interval;
    cell5.innerHTML = description;

    // DaisyUI toggle switch for cell 6
    var toggleSwitch = document.createElement('input');
    toggleSwitch.type = 'checkbox';
    toggleSwitch.classList.add('toggle');
    cell6.appendChild(toggleSwitch);
    cell6.classList.add('flex', 'items-center', 'justify-center');

    // Flex container for icons in cell 7
    var iconsContainer = document.createElement('div');
    iconsContainer.classList.add('flex', 'items-center');

    // Anchor for pencil icon
    var editLink = document.createElement('a');
    editLink.href = 'edit-task-form.html';
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
        var rowIndex = newRow.rowIndex;
        table.deleteRow(rowIndex);

    // Remove corresponding data from local storage
    var existingData = JSON.parse(localStorage.getItem('formData'));
    existingData.splice(rowIndex - 1, 1);
    localStorage.setItem('formData', JSON.stringify(existingData));

        // if last row is deleted, empty row added back to table
        if (table.rows.length === 1) {
            emptyRow = tbody.querySelector('.empty-row');
            if (!emptyRow) {
                emptyRow = tbody.insertRow(-1);
                emptyRow.classList.add('empty-row');
                var emptyCell = emptyRow.insertCell(0);
                emptyCell.colSpan = 7;
                emptyCell.classList.add('text-center');
                emptyCell.textContent = 'No tasks added yet';
            }
        }
    });

    // adding edit functionality to pencil icon
    pencilIcon.addEventListener('click', function() {
        var rowData = {
            task: task,
            category: category,
            startDate: startDate,
            interval: interval,
            description: description
        };
        localStorage.setItem('editTaskData', JSON.stringify(rowData));
        localStorage.setItem('editTaskRowIndex', newRow.rowIndex);

        // Clear previously deleted task data
        localStorage.removeItem('deletedTaskData');
        localStorage.removeItem('deletedTaskRowIndex');

        window.location.href = 'edit-task-form.html';
    });
}

//Event listener for the edit task form page
document.addEventListener('DOMContentLoaded', function() {
    var rowData = JSON.parse(localStorage.getItem('editTaskData'));
    if (rowData) {
        var taskNameField = document.getElementById('taskName');
        if (taskNameField) {
            taskNameField.value = rowData.task;
        }

        var categoryField = document.getElementById('category');
        if (categoryField) {
            categoryField.value = rowData.category;
        }

        var startDateField = document.getElementById('startDate');
        if (startDateField) {
            startDateField.value = rowData.startDate;
        }

        var intervalField = document.getElementById('interval');
        if (intervalField) {
            intervalField.value = rowData.interval;
        }

        var descriptionField = document.getElementById('description');
        if (descriptionField) {
            descriptionField.value = rowData.description;
        }
    }

    localStorage.removeItem('editTaskData');
});

//Event listener for the submit button
document.addEventListener('DOMContentLoaded', function() {
    var editSubmitBtn = document.getElementById('editSubmitBtn');
    if (editSubmitBtn) {
    editSubmitBtn.addEventListener('click', function() {
        var updatedTask = document.getElementById('taskName').value;
        var updatedCategory = document.getElementById('category').value;
        var updatedStartDate = document.getElementById('startDate').value;
        var updatedInterval = document.getElementById('interval').value;
        var updatedDescription = document.getElementById('description').value;

        var rowIndex = localStorage.getItem('editTaskRowIndex');

        var existingData = JSON.parse(localStorage.getItem('formData'));

        console.log('Existing Data Before Update:', existingData);

        existingData[rowIndex] = {
            task: updatedTask,
            category: updatedCategory,
            startDate: updatedStartDate,
            interval: updatedInterval,
            description: updatedDescription
        };

        console.log('Existing Data After Update:', existingData);

        localStorage.setItem('formData', JSON.stringify(existingData));

        window.location.href = 'dashboard.html';

    });
    }
});

if (document.getElementById("taskTable")) {
    displayFormData();
};