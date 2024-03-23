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

// function to retrieve the data from storage to display it in the dashboard table
function displayFormData() {
    var formData = JSON.parse(localStorage.getItem('formData'));

    if (formData) {
        formData.forEach(entry => {
            addToTable(entry.task, entry.category, entry.startDate, entry.interval, entry.description);
        });
    } else {
        addToTable('', '', '', '', '');
        var emptyRow = document.getElementById("taskTable").querySelector('.empty-row');
        emptyRow.classList.add('empty-row');
    }
}

// function to add a new row to exisiting dashboard table with the retrieved data
function addToTable(task, category, startDate, interval, description) {
    
    var table = document.getElementById("taskTable");
    var tbody = table.querySelector('tbody');

    // check if there are any empty rows
    var emptyRow = tbody.querySelector('.empty-row');

    // if statement to check if first row needs to replace the empty default row
    if (emptyRow) {
        var newRow = emptyRow;
        newRow.classList.remove('empty-row'); 
    } else {
        var newRow = tbody.insertRow(-1);
    };

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
};

if (document.getElementById("taskTable")) {
    displayFormData();
};