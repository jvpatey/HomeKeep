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

function displayFormData() {
    var formData = JSON.parse(localStorage.getItem('formData'));

    if (formData) {
        formData.forEach(entry => {
            addToTable(entry.task, entry.category, entry.startDate, entry.interval, entry.description);
        });
    }
}

function addToTable(task, category, startDate, interval, description) {
    
    var table = document.getElementById("taskTable");
    var row = table.insertRow(-1);

    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    var cell4 = row.insertCell(3);
    var cell5 = row.insertCell(4);
   
    cell1.innerHTML = task;
    cell2.innerHTML = category;
    cell3.innerHTML = startDate;
    cell4.innerHTML = interval;
    cell5.innerHTML = description;
}

if (document.getElementById("taskTable")) {
    displayFormData();
}