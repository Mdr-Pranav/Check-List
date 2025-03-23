# Daily Quest Checklist

A fully front-end web application that allows users to track daily tasks in a gamified quest format. Tasks can be added, deleted, and marked as complete. All tasks automatically reset at midnight every day.

## Features

- Add custom tasks to your daily quest
- Mark tasks as completed with a single click
- Delete tasks you no longer need
- Automatic reset of all tasks at midnight
- Countdown timer showing time until next reset
- Local storage to preserve your tasks between sessions
- Responsive design that works on all devices
- Themed UI inspired by RPG quest interfaces

## Technologies Used

- HTML5
- CSS3
- Vanilla JavaScript (No frameworks)
- LocalStorage API for data persistence
- Font Awesome for icons

## Usage

1. Open `index.html` in any modern web browser
2. Add your daily tasks using the input field at the bottom
3. Click on a task to mark it as complete
4. Click the X button to delete a task
5. Tasks will automatically reset to incomplete at midnight

## How It Works

- Tasks are stored in the browser's localStorage
- The application checks the current date on load and every minute thereafter
- When a new day is detected, all tasks are reset to incomplete
- The countdown timer displays the time remaining until the next reset
