import { loadTasks, saveTasks } from './storage.js';

let tasks = [];
let currentFilter = 'all';

export function initTodoApp() {
    const taskInput = document.getElementById('task-input');
    const addBtn = document.getElementById('add-btn');
    const taskList = document.getElementById('task-list');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const taskCount = document.getElementById('count');
    const snackbar = document.getElementById('snackbar');

    tasks = loadTasks();
    renderTasks();
    updateTaskCount();

    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTask();
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    clearCompletedBtn.addEventListener('click', clearCompletedTasks);

    function addTask() {
        const taskText = taskInput.value.trim();
        if (taskText === '') return;
        const newTask = {
            id: Date.now(),
            text: taskText,
            completed: false
        };
        tasks.unshift(newTask);
        saveTasks(tasks);
        renderTasks();
        updateTaskCount();
        taskInput.value = '';
        taskInput.focus();
        showSnackbar('Task added successfully!');
    }

    function renderTasks() {
        taskList.innerHTML = '';
        let filteredTasks = tasks;
        if (currentFilter === 'active') {
            filteredTasks = tasks.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = tasks.filter(task => task.completed);
        }
        if (filteredTasks.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.textContent = currentFilter === 'all' ? 'No tasks yet!' : 
                                     currentFilter === 'active' ? 'No active tasks!' : 'No completed tasks!';
            emptyMessage.classList.add('empty-message');
            taskList.appendChild(emptyMessage);
            return;
        }
        filteredTasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.classList.add('task-item');
            if (task.completed) taskItem.classList.add('completed');
            taskItem.dataset.id = task.id;
            taskItem.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text">${task.text}</span>
                <button class="delete-btn"><i class="fas fa-trash"></i></button>
            `;
            const checkbox = taskItem.querySelector('.task-checkbox');
            const deleteBtn = taskItem.querySelector('.delete-btn');
            const taskText = taskItem.querySelector('.task-text');
            checkbox.addEventListener('change', () => toggleTaskComplete(task.id));
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTask(task.id);
            });
            taskText.addEventListener('dblclick', () => editTask(task.id, taskText));
            taskList.appendChild(taskItem);
        });
    }

    function toggleTaskComplete(id) {
        tasks = tasks.map(task => {
            if (task.id === id) {
                return {...task, completed: !task.completed};
            }
            return task;
        });
        saveTasks(tasks);
        renderTasks();
        updateTaskCount();
    }

    function deleteTask(id) {
        const taskIndex = tasks.findIndex(task => task.id === id);
        if (taskIndex !== -1) {
            const deletedTask = tasks.splice(taskIndex, 1)[0];
            saveTasks(tasks);
            renderTasks();
            updateTaskCount();
            showSnackbar('Task deleted', true, deletedTask);
        }
    }

    function editTask(id, taskTextElement) {
        const currentText = taskTextElement.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentText;
        input.classList.add('edit-input');
        taskTextElement.replaceWith(input);
        input.focus();
        function saveEdit() {
            const newText = input.value.trim();
            if (newText && newText !== currentText) {
                tasks = tasks.map(task => {
                    if (task.id === id) {
                        return {...task, text: newText};
                    }
                    return task;
                });
                saveTasks(tasks);
                renderTasks();
                showSnackbar('Task updated');
            } else {
                renderTasks();
            }
        }
        input.addEventListener('blur', saveEdit);
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') saveEdit();
        });
    }

    function clearCompletedTasks() {
        tasks = tasks.filter(task => !task.completed);
        saveTasks(tasks);
        renderTasks();
        updateTaskCount();
        showSnackbar('Completed tasks cleared');
    }

    function updateTaskCount() {
        const activeTasks = tasks.filter(task => !task.completed).length;
        taskCount.textContent = `${activeTasks} ${activeTasks === 1 ? 'task' : 'tasks'} left`;
    }

    function showSnackbar(message, showUndo = false, deletedTask = null) {
        snackbar.textContent = message;
        if (showUndo && deletedTask) {
            const undoBtn = document.createElement('button');
            undoBtn.textContent = 'Undo';
            undoBtn.classList.add('undo-btn');
            undoBtn.addEventListener('click', () => {
                tasks.unshift(deletedTask);
                saveTasks(tasks);
                renderTasks();
                updateTaskCount();
                snackbar.classList.remove('show');
            });
            snackbar.appendChild(undoBtn);
        }
        snackbar.classList.add('show');
        setTimeout(() => {
            snackbar.classList.remove('show');
            setTimeout(() => {
                snackbar.textContent = '';
                snackbar.innerHTML = '';
            }, 500);
        }, 3000);
    }
} 