# 🏠 HomeKeep

📝 Description
-
 
Welcome to HomeKeep: your go-to app for effortless home maintenance.
HomeKeep is designed to streamline your household tasks by setting up timely notifications for all your home maintenance needs. With HomeKeep, you can easily input tasks, assign start dates, and receive notifications when they are due, ensuring that nothing falls through the cracks.

✨ Motivation
-
 
The motivation for this project came from the desire to make managing home maintenance schedules simpler and more efficient. 
In today's fast-paced world, it's easy to overlook critical home maintenance tasks. 
However, forgetting to perform regular maintenance can lead to unnecessary wear and tear on equipment, resulting in costly repairs. 
This application aims to provide homeowners with an easy way stay on top of their maintenance schedules and avoid these issues.

🛠️ Built with
-

[![My Skills](https://skillicons.dev/icons?i=html,css,tailwind,js,firebase)](https://skillicons.dev)

🚀 How to run
-

This project is hosted and deployed through Firebase. To access the application, use the link below:

https://homekeep-site.web.app/

🏄‍♀️ Custom Installation 
-

To run the HomeKeep frontend locally, you'll need to serve the files with a server. 
A simple solution is to use python:

On MacOS:

```
python3 -m http.server 8100
```

On Windows:

```
py -m http.server 8100
```

### Firebase Configuration

HomeKeep is already configured to use a Firebase instance by default, but if you want to 
use your own custom firebase: 

### Custom Firebase for Frontend

You can replace the config in js/firebase-config.js.

### Cloud Functions

HomeKeep uses Firebase Cloud Functions to manage the notification backend. It interacts with NotificationAPI to trigger the sending of notifications for tasks. To use the Cloud Functions, you will need to set up an account with [NotificationAPI](https://www.notificationapi.com/). Once you are logged in, you'll need to:

- Create a new notification
- Configure it to use email as the channel.
- Design the notification using the template in the NotificationAPI interface.
- After setup, you'll receive a clientID and clientSecret.
- Replace 'your_client_id' and 'your_client_secret' with your NotificationAPI credentials in the provided cloud function.

The functions can be found in CloudAPI.

```
cd CloudAPI
firebase login
firebase use 
```

After you perform firebase use, select your project from the list.

```
firebase deploy --only functions
```

📋 How to use
-

### Account creation
When you first visit the app, you'll be welcomed by the home screen. To use the app's features, you'll need to create an account. Support for authentication is offered through Firebase, with the following methods:

<img width="1000" alt="Welcome screen" src="https://github.com/jvpatey/HomeKeep/assets/160293578/01fd1804-7621-4a0f-9b38-d651973b854f">

  - Username/Password: If you choose this option, you'll be provided with a link to a form where you can create an account.
  - Google Sign-In: Use your Google account for a faster login experience.

<img width="655" alt="create account" src="https://github.com/jvpatey/HomeKeep/assets/160293578/e0084ca1-dc6c-4ca1-b850-5f5bf408bd8e">


### Dashboard and Navigation

Once you're logged in, you'll be taken to the default dashboard page. Here are the key features and navigation options:

<img width="1508" alt="Dashboard" src="https://github.com/jvpatey/HomeKeep/assets/160293578/cd3894bb-f1f7-49da-ab12-7e2fc7b112aa">


- Dropdown Menu: This drop-down menu offers quick links to sign out, access the About page, and a Getting Started guide.

  - About Page: Provides a description of the app's purpose and features.
  - Getting Started: A step-by-step guide to help you make the most of the app.

- Table View: This is the default view of the dashboard. You can add maintenance tasks by clicking the + button, which opens a form to input task details. Once submitted, the task is stored in Firestore and displayed in the table.

<img width="638" alt="Add task" src="https://github.com/jvpatey/HomeKeep/assets/160293578/d8a6c20c-dcd8-48fc-8fdb-c6e6586b99ce">

- Edit/Delete: Each row in the table has buttons for editing or deleting the task.
- Switch to Calendar: A button is provided to switch to a calendar view.

<img width="1504" alt="Table - edit:delete" src="https://github.com/jvpatey/HomeKeep/assets/160293578/a7820663-a705-4c8c-bd22-307c098603e5">


### Calendar

The calendar view displays tasks based on their start date and recurrence intervals. Tasks are color-coded based on their category. You can interact with tasks in the following ways:

<img width="1505" alt="Calendar" src="https://github.com/jvpatey/HomeKeep/assets/160293578/71d9cb43-fa9e-490d-83be-88de7da407e6">


  - Task Details Modal: Click on a task in the calendar to open a modal with detailed information.
  - Edit/Delete: The modal includes buttons for editing and deleting the task.

<img width="740" alt="Taslk details" src="https://github.com/jvpatey/HomeKeep/assets/160293578/849b1938-1f78-4329-8405-332563eaeeb2">


### Notifications

To ensure you never miss a task, the app provides email notifications through Firebase Cloud Functions. 
You will receive an email for each task on the day it's due, through the email you provided at login.

### Help and Support

Need assistance? Click the chat icon in the bottom right corner to access a Google Forms-based help request form. Describe your issue, and I'll respond via your provided email to assist you.

<img width="564" alt="Help request" src="https://github.com/jvpatey/HomeKeep/assets/160293578/42824d82-c198-4074-b8c0-3ff93012b359">

### Dark Mode

A dark mode toggle is available on each page to switch between light/dark mode at your preference.

<img width="1506" alt="Dark mode" src="https://github.com/jvpatey/HomeKeep/assets/160293578/18c7a814-815e-462f-966c-9987a83f0146">

🌟 Credits
-

As my first project in module 1 with GetCoding, I want to give thanks to my coach, Allan Lavell, for his guidance and support throughout this project. Allan's work in developing the backend and implementing cloud functions for notifications allowed this project to work as it should. Thank you, Allan, for helping make this project a success!