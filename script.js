document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const taskList = document.getElementById('task-list');
    const newTaskInput = document.getElementById('new-task');
    const addTaskBtn = document.getElementById('add-task-btn');
    const resetTimeElement = document.getElementById('reset-time');
    const notificationDialog = document.getElementById('notification');
    const yesBtn = document.getElementById('yes-btn');
    const noBtn = document.getElementById('no-btn');

    // Cookie management functions
    function setCookie(name, value, days) {
        let expires = '';
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toUTCString();
        }
        document.cookie = name + '=' + encodeURIComponent(JSON.stringify(value)) + expires + '; path=/';
    }

    function getCookie(name) {
        const nameEQ = name + '=';
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) {
                try {
                    return JSON.parse(decodeURIComponent(c.substring(nameEQ.length, c.length)));
                } catch (e) {
                    return null;
                }
            }
        }
        return null;
    }

    function deleteCookie(name) {
        document.cookie = name + '=; Max-Age=-99999999; path=/';
    }

    // Function to get a friendly device name
    function getDeviceName() {
        const userAgent = navigator.userAgent;
        let deviceName = 'Unknown Device';
        
        if (/Android/i.test(userAgent)) {
            deviceName = 'Android Device';
        } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
            deviceName = userAgent.match(/iPhone|iPad|iPod/i)[0];
        } else if (/Windows/i.test(userAgent)) {
            deviceName = 'Windows PC';
        } else if (/Mac/i.test(userAgent)) {
            deviceName = 'Mac';
        } else if (/Linux/i.test(userAgent)) {
            deviceName = 'Linux Device';
        }
        
        return deviceName;
    }

    // Generate a unique device ID if not already stored
    function getDeviceId() {
        let deviceData = getCookie('quest_device_id');
        if (!deviceData) {
            const randomId = 'device_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
            deviceData = {
                id: randomId,
                name: getDeviceName(),
                created: new Date().toISOString()
            };
            setCookie('quest_device_id', deviceData, 365); // Store for a year
        }
        return deviceData;
    }

    // Get or create device ID
    const deviceData = getDeviceId();
    const deviceId = deviceData.id;
    const deviceName = deviceData.name;
    
    // Set device indicator tooltip
    const deviceIndicator = document.getElementById('device-indicator');
    if (deviceIndicator) {
        deviceIndicator.title = `Current device: ${deviceName}`;
    }
    
    // Set notification dialog device indicator tooltip
    const notificationDeviceIndicator = document.getElementById('notification-device-indicator');
    if (notificationDeviceIndicator) {
        notificationDeviceIndicator.title = `Current device: ${deviceName}`;
    }
    
    // Load tasks from cookies or localStorage as fallback
    let tasks = getCookie('quest_tasks') || JSON.parse(localStorage.getItem('dailyTasks')) || [];
    
    // Load last reset date from cookies or localStorage as fallback
    let lastResetDate = getCookie('quest_last_reset') || localStorage.getItem('lastResetDate') || '';
    
    // Migrate any existing localStorage data to cookies
    if (localStorage.getItem('dailyTasks')) {
        setCookie('quest_tasks', tasks, 365);
        localStorage.removeItem('dailyTasks');
    }
    
    if (localStorage.getItem('lastResetDate')) {
        setCookie('quest_last_reset', lastResetDate, 7);
        localStorage.removeItem('lastResetDate');
    }
    
    // Check if reset is needed (new day)
    checkAndResetTasks();
    
    // Render tasks
    renderTasks();
    
    // Update reset time display
    updateResetTimeDisplay();
    
    // Add event listeners
    addTaskBtn.addEventListener('click', addTask);
    newTaskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    
    // Event listeners for notification dialog buttons
    yesBtn.addEventListener('click', function() {
        // Reset all tasks
        tasks.forEach(task => {
            task.completed = false;
            task.progress = 0;
            task.lastCompletedBy = null;
            task.lastCompletedAt = null;
            task.lastCompletedByName = null;
        });
        // Save the reset state
        saveTasks();
        renderTasks();
        // Hide the notification dialog
        hideNotification();
        // Clear stored task data
        deleteCookie('quest_tasks');
    });
    
    noBtn.addEventListener('click', () => {
        hideNotification();
    });
    
    // Set interval to check for reset and update timer
    setInterval(() => {
        checkAndResetTasks();
        updateResetTimeDisplay();
        checkAllTasksCompleted();
    }, 1000); // Update every second for a smoother countdown
    
    // Functions
    function addTask() {
        const taskText = newTaskInput.value.trim();
        if (taskText) {
            const newTask = {
                id: Date.now(),
                text: taskText,
                completed: false,
                progress: 0,
                target: 10,
                createdBy: deviceId,
                lastCompletedBy: null,
                lastCompletedAt: null
            };
            
            tasks.push(newTask);
            saveTasks();
            renderTasks();
            newTaskInput.value = '';
        }
    }
    
    function toggleTaskCompletion(taskId) {
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            const task = tasks[taskIndex];
            
            if (task.completed) {
                task.completed = false;
                task.progress = 0;
                task.lastCompletedBy = null;
                task.lastCompletedAt = null;
                task.lastCompletedByName = null;
            } else {
                task.completed = true;
                task.progress = task.target;
                task.lastCompletedBy = deviceId;
                task.lastCompletedAt = new Date().toISOString();
                task.lastCompletedByName = deviceName;
            }
            
            saveTasks();
            renderTasks();
            
            // Check if all tasks are completed
            checkAllTasksCompleted();
        }
    }
    
    function deleteTask(taskId) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        renderTasks();
    }
    
    function renderTasks() {
        taskList.innerHTML = '';
        
        tasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
            
            const taskName = document.createElement('div');
            taskName.className = 'task-name';
            taskName.addEventListener('click', () => toggleTaskCompletion(task.id));
            
            const taskText = document.createElement('span');
            taskText.className = 'task-text';
            taskText.textContent = task.text;
            
            const taskProgress = document.createElement('span');
            taskProgress.className = 'task-progress';
            taskProgress.textContent = `[${task.completed ? task.target : 0}/${task.target}]`;
            
            // Add device info if completed by a different device
            if (task.completed && task.lastCompletedBy && task.lastCompletedBy !== deviceId) {
                taskItem.classList.add('completed-by-other');
                const completedTime = task.lastCompletedAt ? new Date(task.lastCompletedAt).toLocaleString() : 'Unknown time';
                const completedBy = task.lastCompletedByName || 'Another device';
                taskItem.title = `Completed by ${completedBy} on ${completedTime}`;
            }
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'task-delete';
            deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTask(task.id);
            });
            
            taskName.appendChild(taskText);
            taskName.appendChild(taskProgress);
            taskItem.appendChild(taskName);
            taskItem.appendChild(deleteBtn);
            
            taskList.appendChild(taskItem);
        });
        
        // Add default tasks if list is empty
        if (tasks.length === 0) {
            const defaultTasks = [
                { id: 1, text: '100 PUSH-UPS', completed: false, progress: 0, target: 100, createdBy: deviceId },
                { id: 2, text: '100 SIT-UPS', completed: false, progress: 0, target: 100, createdBy: deviceId },
                { id: 3, text: '100 SQUATS', completed: false, progress: 0, target: 100, createdBy: deviceId }
            ];
            
            tasks = defaultTasks;
            saveTasks();
            renderTasks();
        }
    }
    
    function saveTasks() {
        setCookie('quest_tasks', tasks, 365); // Store for a year
    }
    
    function checkAndResetTasks() {
        const today = new Date().toDateString();
        
        // If it's a new day, reset tasks
        if (lastResetDate !== today) {
            tasks.forEach(task => {
                task.completed = false;
                task.progress = 0;
                task.lastCompletedBy = null;
                task.lastCompletedAt = null;
                task.lastCompletedByName = null;
            });
            
            lastResetDate = today;
            setCookie('quest_last_reset', lastResetDate, 7);
            saveTasks();
            renderTasks();
            
            // Show notification on new day
            showNotification();
        }
    }
    
    function updateResetTimeDisplay() {
        const now = new Date();
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        
        const timeUntilMidnight = midnight - now;
        const hours = Math.floor(timeUntilMidnight / (1000 * 60 * 60));
        const minutes = Math.floor((timeUntilMidnight % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeUntilMidnight % (1000 * 60)) / 1000);
        
        // Format as HH:MM:SS with leading zeros
        const formattedHours = String(hours).padStart(2, '0');
        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(seconds).padStart(2, '0');
        
        resetTimeElement.innerHTML = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    }
    
    function checkAllTasksCompleted() {
        if (tasks.length > 0 && tasks.every(task => task.completed)) {
            // Save completed state to prevent showing multiple notifications
            if (!getCookie('quest_all_completed')) {
                setCookie('quest_all_completed', true, 1);
                showNotification();
            }
        } else {
            deleteCookie('quest_all_completed');
        }
    }
    
    function showNotification() {
        notificationDialog.classList.add('active');
    }
    
    function hideNotification() {
        notificationDialog.classList.remove('active');
    }
}); 