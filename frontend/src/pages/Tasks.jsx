import React, { useState, useEffect, useRef } from 'react';
import './Tasks.css'; 
import TimerWhiteNoises from '../components/Timer-WhiteNoise.jsx';
import { ReactComponent as NowIcon } from "../icones/now.svg";
import { ReactComponent as ArrowDownIcon } from "../icones/arrow-down.svg";
import { ReactComponent as LaterIcon } from "../icones/later.svg";
import { ReactComponent as SearchIcon } from "../icones/search.svg";
import { ReactComponent as FilterIcon } from "../icones/filter.svg";
import { ReactComponent as PlusIcon } from "../icones/plus.svg";
import { ReactComponent as SixDotsIcon } from "../icones/six-dots.svg";

import { ReactComponent as ArchiveIcon } from "../icones/archive.svg";
import { ReactComponent as BinIcon } from "../icones/bin.svg";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const Tasks = () => {
  // State for form inputs
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDuration, setTaskDuration] = useState("3h 45m");
  const [taskPriority, setTaskPriority] = useState("Low");
  const [taskEmoji, setTaskEmoji] = useState("😃");
  const [taskTag, setTaskTag] = useState({
    name: "Personal life",
    color: "#6366F1",
  });

  // Load tasks from localStorage on component mount
  const [laterTasks, setLaterTasks] = useState(() => {
    const savedTasks = localStorage.getItem("laterTasks");
    if (savedTasks) {
      return JSON.parse(savedTasks);
    } else {
      return [
        {
          id: 2,
          title: "Second Task",
          description: "My second task's description is long is so long...",
          time: "2h 30m",
          emoji:
            "https://em-content.zobj.net/source/apple/419/beaming-face-with-smiling-eyes_1f601.png",
          priority: "Medium",
          tag: { name: "Personal life", color: "#6366F1" },
        },
        {
          id: 3,
          title: "Third Task",
          description: "My third task's description is long is so long...",
          time: "1h 23m",
          emoji:
            "https://em-content.zobj.net/source/apple/419/beaming-face-with-smiling-eyes_1f601.png",
          priority: "Low",
          tag: { name: "Personal life", color: "#6366F1" },
        },
        {
          id: 4,
          title: "Fourth Task",
          description: "My fourth task's description is long is so long...",
          time: "1h 23m",
          emoji:
            "https://em-content.zobj.net/source/apple/419/beaming-face-with-smiling-eyes_1f601.png",
          priority: "High",
          tag: { name: "Personal life", color: "#6366F1" },
        },
      ];
    }
  });

  const SortableItem = ({ task }) => {
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id: task.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      // Remove cursor: "grab" from here, it will be applied to the handle
    };

    // Add state for menu visibility
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Toggle menu visibility
    const toggleMenu = () => {
      setIsMenuOpen(!isMenuOpen);
    };

    return (
      // Apply attributes to the main div
      <div ref={setNodeRef} style={style} {...attributes}>
        {/* Integrate renderTaskCard logic here */}
        <div
          className={`later-tasks-card ${isMenuOpen ? "expanded" : ""}`}
          key={task.id}
        >
          <div className="later-tasks-card-top-row">
            <div className="later-tasks-card-emoji-text-container">
              <div className="later-tasks-card-emoji-container">
                {/* Apply listeners and cursor style to the SixDotsIcon */}
                <SixDotsIcon
                  className="later-tasks-card-emoji-dots"
                  {...listeners} // Apply listeners here
                  style={{ cursor: "grab" }} // Add grab cursor style
                />
                <img
                  className="later-tasks-card-emoji"
                  src={task.emoji}
                  alt="emoji"
                />
              </div>
              <div className="later-tasks-card-text">
                <div className="later-tasks-card-title-div">
                  <p className="later-tasks-card-title">{task.title}</p>
                  <p className="later-tasks-card-time">{task.time}</p>
                </div>
                <p className="later-tasks-card-description">
                  {task.description}
                </p>
              </div>
            </div>
            <ArrowDownIcon
              className={`tasks-arrow-down-icon ${isMenuOpen ? "rotated" : ""}`}
              onClick={toggleMenu}
            />
          </div>

          {/* Conditionally render the menu */}
          {isMenuOpen && (
            <div className="task-card-menu">
              <button className="menu-item">
                <NowIcon className="menu-icon" /> move to Now
              </button>
              <button className="menu-item">
                <ArchiveIcon className="menu-icon" /> archive
              </button>
              <button className="menu-item delete">
                <BinIcon className="menu-icon" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 2. In your component body, below states:
  const sensors = useSensors(useSensor(PointerSensor));

  // 3. Handle drag end:
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = laterTasks.findIndex((task) => task.id === active.id);
      const newIndex = laterTasks.findIndex((task) => task.id === over?.id);
      setLaterTasks((tasks) => arrayMove(tasks, oldIndex, newIndex));
    }
  };

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("laterTasks", JSON.stringify(laterTasks));
  }, [laterTasks]);

  const [showModal, setShowModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const modalContentRef = useRef(null);

  // Search functionality
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const searchInputRef = useRef(null);
  const searchButtonRef = useRef(null);
  const searchContainerRef = useRef(null);

  const openModal = () => {
    // Reset form fields when opening modal
    setTaskTitle("");
    setTaskDescription("");
    setTaskDuration("3h 45m");
    setTaskPriority("Low");
    setTaskEmoji("😃");
    setTaskTag({ name: "Personal life", color: "#6366F1" });

    setShowModal(true);
    setIsClosing(false);
  };

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowModal(false);
      setIsClosing(false);
    }, 300); // Match this with the animation duration (0.3s)
  };

  // Add new task
  // Add these state variables at the top with your other state declarations
  const [errors, setErrors] = useState({
    title: "",
    description: "",
  });

  // Add a state to track if form has been submitted
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Modify the addTask function
  const addTask = () => {
    // Set form as submitted to activate validation display
    setFormSubmitted(true);

    // Reset errors first
    const newErrors = {
      title: "",
      description: "",
    };

    // Validate fields
    let isValid = true;

    if (!taskTitle.trim()) {
      newErrors.title = "Please enter a task title";
      isValid = false;
    }

    if (!taskDescription.trim()) {
      newErrors.description = "Please enter a task description";
      isValid = false;
    }

    // Update error state
    setErrors(newErrors);

    // If validation fails, return early
    if (!isValid) return;

    // Create new task object
    const newTask = {
      id: Date.now(), // Use timestamp as unique ID
      title: taskTitle,
      description: taskDescription,
      time: taskDuration,
      emoji:
        taskEmoji === "😃"
          ? "https://em-content.zobj.net/source/apple/419/beaming-face-with-smiling-eyes_1f601.png"
          : taskEmoji,
      priority: taskPriority,
      tag: taskTag,
    };

    // Add to tasks array
    setLaterTasks((prevTasks) => [newTask, ...prevTasks]);

    // Reset form submitted state
    setFormSubmitted(false);

    // Close modal
    closeModal();
  };

  // Handle ESC key press
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        if (showModal) {
          closeModal();
        } else if (isSearchExpanded) {
          closeSearch();
        }
      }
    };

    window.addEventListener("keydown", handleEscKey);
    return () => {
      window.removeEventListener("keydown", handleEscKey);
    };
  }, [showModal, isSearchExpanded]);

  // Handle click outside modal
  const handleOverlayClick = (event) => {
    if (
      modalContentRef.current &&
      !modalContentRef.current.contains(event.target)
    ) {
      closeModal();
    }
  };

  // Handle search expansion
  const toggleSearch = () => {
    if (!isSearchExpanded) {
      setIsSearchExpanded(true);
      // Focus the input after the expansion animation completes
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 300);
    } else if (searchQuery.trim() === "") {
      closeSearch();
    }
  };

  const closeSearch = () => {
    setIsSearchExpanded(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Handle search input
  const handleSearchInput = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === "") {
      setSearchResults([]);
      return;
    }

    // Filter tasks based on search query - only search in laterTasks
    const filteredTasks = laterTasks.filter(
      (task) =>
        task.title.toLowerCase().includes(query.toLowerCase()) ||
        task.description.toLowerCase().includes(query.toLowerCase())
    );

    setSearchResults(filteredTasks);
  };

  // Handle click outside search
  useEffect(() => {
    const handleClick = (event) => {
      if (
        isSearchExpanded &&
        searchInputRef.current &&
        searchInputRef.current === event.target
      ) {
        closeSearch();
      }
    };

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [isSearchExpanded]);

  return (
    <div className="tasks-page-container">
      <div className="left-section">
        <TimerWhiteNoises />
      </div>
      <div className="right-section">
        <div className="now-tasks-container">
          <div className="now-tasks-text">
            <NowIcon className="now-icon" />
            <p className="now-tasks">Now</p>
          </div>
          <div className="now-tasks-card">
            <div className="now-tasks-card-emoji-text-container">
              <img
                className="now-tasks-card-emoji"
                src="https://em-content.zobj.net/source/apple/419/beaming-face-with-smiling-eyes_1f601.png"
                alt="emoji"
              />
              <div className="now-tasks-card-text">
                <div className="now-tasks-card-title-div">
                  <p className="now-tasks-card-title">First Task</p>
                  <p className="now-tasks-card-time">1h 05m</p>
                </div>
                <p className="now-tasks-card-description">
                  My first task's description is long is so long...
                </p>
              </div>
            </div>
            <ArrowDownIcon className="tasks-arrow-down-icon" />
          </div>
        </div>
        <div className="later-tasks-container">
          <div className="later-tasks-text-CTA">
            <div className="later-tasks-text">
              <LaterIcon className="later-icon" />
              <p className="later-tasks">Later</p>
            </div>
            <div className="later-tasks-CTA">
              <div className="search-filter-container">
                <div className="search-container" ref={searchContainerRef}>
                  <button
                    ref={searchButtonRef}
                    className={`search-button ${
                      isSearchExpanded ? "expanded" : ""
                    }`}
                    onClick={toggleSearch}
                  >
                    <SearchIcon className="search-icon" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      className={`search-input ${
                        isSearchExpanded ? "visible" : ""
                      }`}
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={handleSearchInput}
                    />
                  </button>
                </div>
                <button className="filter-button">
                  <FilterIcon className="filter-icon" />
                </button>
              </div>
              <button className="add-task-CTA" onClick={openModal}>
                <PlusIcon className="add-task-icon" />
                <p className="add-task-text">Add Task</p>
              </button>
            </div>
          </div>

          {/* Display search results or regular tasks */}
          {searchQuery.trim() !== "" && searchResults.length > 0 ? (
            <div className="search-results-container">
              {/* Use SortableItem for search results as well for consistency */}
              {searchResults.map((task) => (
                <SortableItem key={task.id} task={task} />
              ))}
            </div>
          ) : searchQuery.trim() !== "" && searchResults.length === 0 ? (
            <div className="no-results">No tasks found</div>
          ) : (
            // Regular tasks (only shown when not searching)
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={laterTasks.map((task) => task.id)}
                strategy={verticalListSortingStrategy}
              >
                {laterTasks.map((task) => (
                  <SortableItem key={task.id} task={task} />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Task Modal */}
      {showModal && (
        <div
          className={`modal-overlay ${isClosing ? "closing" : ""}`}
          onClick={handleOverlayClick}
        >
          <div
            className={`modal-content ${isClosing ? "closing" : ""}`}
            ref={modalContentRef}
          >
            <div className="modal-header">
              <h2>Add task</h2>
              <button className="close-button" onClick={closeModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  placeholder="My first task..."
                  className={`modal-input ${
                    formSubmitted && errors.title ? "input-error" : ""
                  }`}
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
                {formSubmitted && errors.title && (
                  <p className="error-message">{errors.title}</p>
                )}
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="My first task's description..."
                  className={`modal-input ${
                    formSubmitted && errors.description ? "input-error" : ""
                  }`}
                  rows="2"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                ></textarea>
                {formSubmitted && errors.description && (
                  <p className="error-message">{errors.description}</p>
                )}
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>Tag</label>
                  <div className="tag-selector">
                    <div className="selected-tag">
                      <span
                        className="tag-dot"
                        style={{ backgroundColor: taskTag.color }}
                      ></span>
                      <span>{taskTag.name}</span>
                    </div>
                    <PlusIcon className="add-tag-button" />
                  </div>
                </div>

                <div className="form-group half">
                  <label>Duration</label>
                  <input
                    type="text"
                    className="modal-input"
                    value={taskDuration}
                    onChange={(e) => setTaskDuration(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>Priority</label>
                  <select
                    className="modal-input"
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>

                <div className="form-group half">
                  <label>Emoji</label>
                  <button className="emoji-selector">{taskEmoji}</button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-button" onClick={closeModal}>
                Cancel
              </button>
              <button className="add-task-button" onClick={addTask}>
                <PlusIcon className="add-task-popup-icon" />
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;