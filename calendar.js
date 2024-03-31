
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function app() {
    var formData = JSON.parse(localStorage.getItem('formData')) || [];
    console.log(formData)

    const events = formData.map((element) => {
        return {
            event_title: element.task,
            event_category: element.category,
            event_date: element.startDate,
            event_interval: element.interval,
            event_description: element.description
        }
    })

    return {
        month: '',
        year: '',
        no_of_days: [],
        blankdays: [],
        days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],

        events: events,
        selectedEvent: {},

        openEventModal: false,

        initDate() {
            let today = new Date();
            this.month = today.getMonth();
            this.year = today.getFullYear();
            this.datepickerValue = new Date(this.year, this.month, today.getDate()).toDateString();
        },

        showEventModal(event) {
            // Open the modal and populate with event details
            this.selectedEvent = event;
            this.openEventModal = true;
        },

        // Function to delete task from local storage
        deleteTask(task) {
            var existingData = JSON.parse(localStorage.getItem('formData')) || [];
            
            // Find index of task in existingData array
            var index = existingData.findIndex(function(item) {
                return item.task === task.event_title && item.startDate === task.event_date; // Modify this condition as per your data structure
            });

            // Remove task from existingData array
            if (index !== -1) {
                existingData.splice(index, 1);
            }

            // Update local storage with modified data
            localStorage.setItem('formData', JSON.stringify(existingData));

            // Update the events array used in the calendar display
            // Filter out the deleted task from the events array
            this.events = this.events.filter(function(event) {
                return !(event.event_title === task.event_title && event.event_date === task.event_date); // Modify this condition as per your data structure
            });

            // Close the task details modal
            this.openEventModal = false;
        },

        showAddTaskForm(date) {
            // Open the add task form modal and preload the selected date
            document.getElementById("startDate").value = this.formatDate(date);
            document.getElementById("addTaskModal").showModal();
        },

        formatDate(date) {
            const d = new Date(this.year, this.month, date);
            const formattedDate = [
                (d.getMonth() + 1).toString().padStart(2, '0'),
                d.getDate().toString().padStart(2, '0'),
                d.getFullYear().toString()
            ].join('-');
            return formattedDate;
        },

        getNoOfDays() {
            let daysInMonth = new Date(this.year, this.month + 1, 0).getDate();

            // find where to start calendar day of week
            let dayOfWeek = new Date(this.year, this.month).getDay();
            let blankdaysArray = [];
            for ( var i=1; i <= dayOfWeek; i++) {
                blankdaysArray.push(i);
            }

            let daysArray = [];
            for ( var i=1; i <= daysInMonth; i++) {
                daysArray.push(i);
            }

            this.blankdays = blankdaysArray;
            this.no_of_days = daysArray;
        },

        // Function to navigate to the previous month
        prevMonth() {
            this.month--;
            if (this.month < 0) {
                this.month = 11;
                this.year--;
            }
            this.getNoOfDays();
        },

        // Function to navigate to the next month
        nextMonth() {
            this.month++;
            if (this.month > 11) {
                this.month = 0;
                this.year++;
            }
            this.getNoOfDays();
        },

        // Function to navigate to the previous year
        prevYear() {
            this.year--;
            this.getNoOfDays();
        },

        // Function to navigate to the next year
        nextYear() {
            this.year++;
            this.getNoOfDays();
        },
    }
}