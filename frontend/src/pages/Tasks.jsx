import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import "./Tasks.css";
import TimerWhiteNoises from "../components/Timer-WhiteNoise.jsx";
import { ReactComponent as NowIcon } from "../icones/now.svg";
import { ReactComponent as ArrowDownIcon } from "../icones/arrow-down.svg";
import { ReactComponent as LaterIcon } from "../icones/later.svg";
import { ReactComponent as SearchIcon } from "../icones/search.svg";
import { ReactComponent as FilterIcon } from "../icones/filter.svg";
import { ReactComponent as PlusIcon } from "../icones/plus.svg";
import { ReactComponent as SixDotsIcon } from "../icones/six-dots.svg";
import { ReactComponent as ArchiveIcon } from "../icones/archive.svg";
import { ReactComponent as BinIcon } from "../icones/bin.svg";
import { ReactComponent as LogoIcon } from "../icones/icon.svg";

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

// Import the EmojiPicker component
import EmojiPicker, { EmojiStyle } from "emoji-picker-react";

const Tasks = () => {
  // State for form inputs
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState(
    localStorage.getItem("taskTitle") || ""
  );
  const [taskDescription, setTaskDescription] = useState(
    localStorage.getItem("taskDescription") || ""
  );
  const [isDescriptionSuggested, setIsDescriptionSuggested] = useState(false);
  const [suggestionText, setSuggestionText] = useState(""); // New state for suggestion text

  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const debounceTimeout = useRef(null);

  const [taskDuration, setTaskDuration] = useState(() => {
    const defaultTaskLength = localStorage.getItem("defaultTaskLength");
    if (defaultTaskLength === "25") {
      return "0h 25m";
    } else if (defaultTaskLength === "50") {
      return "0h 50m";
    }
    return "3h 45m"; // Fallback value
  });
  const [taskPriority, setTaskPriority] = useState(
    localStorage.getItem("taskPriority") || "Low"
  );
  const [taskEmoji, setTaskEmoji] = useState(
    localStorage.getItem("taskEmoji") || "😃"
  );
  const [taskTag, setTaskTag] = useState(() => {
    const storedTag = localStorage.getItem("taskTag");
    return storedTag
      ? JSON.parse(storedTag)
      : {
          name: "Personal life",
          color: "#6366F1",
        };
  });

  // Add these new states and refs for notifications
  const [notifications, setNotifications] = useState([]);
  const notificationTimeoutsRef = useRef({});

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const titleInputRef = useRef(null);
  const descriptionInputRef = useRef(null);
  const durationInputRef = useRef(null);
  const emojiButtonRef = useRef(null);

  const generateDescription = async (title) => {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.REACT_APP_GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: `Suggest a short description (max 50 characters), Do not say anything other than the description. for a task titled: "${title}"`,
          },
        ],
        max_tokens: 50,
      }),
    });

    const data = await res.json();
    console.log("GPT API response:", data);

    let content = data.choices?.[0]?.message?.content?.trim() || "";

    // Remove leading and trailing double quotes if they exist
    if (content.startsWith('"') && content.endsWith('"')) {
      content = content.slice(1, -1); // Remove the first and last character
    }

    return content;
  };

  const generatePriority = async (title) => {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.REACT_APP_GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: `Estimate the priority (Low, Medium, or High only) for a task titled: "${title}". Reply with only one of these three words.`,
          },
        ],
        max_tokens: 5,
      }),
    });

    const data = await res.json();
    let content = data.choices?.[0]?.message?.content?.trim();

    // Normalize and validate response
    const validPriorities = ["Low", "Medium", "High"];
    if (validPriorities.includes(content)) {
      return content;
    }

    return "Low"; // Default fallback
  };

  const generateEmoji = async (title) => {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.REACT_APP_GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: `Suggest the most relevant single emoji (only 1 emoji, nothing else) for this task title: "${title}".`,
          },
        ],
        max_tokens: 10,
      }),
    });

    const data = await res.json();
    console.log("Emoji response:", data);

    let content = data.choices?.[0]?.message?.content?.trim() || "";

    // Ensure only one emoji is returned
    const emojiMatch = content.match(/[\p{Emoji}]/u);
    return emojiMatch ? emojiMatch[0] : "😃"; // default emoji fallback
  };

  const estimateDuration = async (title) => {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.REACT_APP_GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: `Estimate a realistic time duration for a task titled: "${title}". Respond with just a short duration string like "0h 45m", "1h 00m", or "3h 30m" — do not include any explanation. always include hours and minutes like in the examples. if there is time in that task, include it with the format of the example.`,
          },
        ],
        max_tokens: 20,
      }),
    });

    const data = await res.json();
    console.log("Duration response:", data);

    let content = data.choices?.[0]?.message?.content?.trim() || "";

    // Cleanup any quotes or extras
    content = content.replace(/^"|"$/g, "");
    return content.match(/^(\d+h\s*)?(\d+m)?$/) ? content : "1h";
  };

  const handleTitleChange = (e) => {
    const value = e.target.value;
    setTaskTitle(value);

    // Debounce GPT call
    clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(async () => {
      if (value.length > 3 && taskDescription.trim() === "") {
        setIsGeneratingDesc(true);
        const suggestion = await generateDescription(value);
        setSuggestionText(suggestion);
        setTaskDescription("");
        setIsDescriptionSuggested(true);
        setIsGeneratingDesc(false);
      }

      const suggestedEmoji = await generateEmoji(value);
      setTaskEmoji(suggestedEmoji);

      const suggestedDuration = await estimateDuration(value);
      setTaskDuration(suggestedDuration);

      const aiPriority = await generatePriority(value);
      setTaskPriority(aiPriority);
      localStorage.setItem("taskPriority", aiPriority);
    }, 1000);
  };

  const handleDescriptionChange = (e) => {
    // When the user types, the suggestion is no longer active
    if (isDescriptionSuggested) {
      setIsDescriptionSuggested(false);
      setSuggestionText(""); // Clear the suggestion text
    }
    setTaskDescription(e.target.value); // Update the actual input value
  };

  const handleDescriptionKeyDown = (e) => {
    // Handle Tab key press to accept the suggestion
    if (e.key === "Tab" && isDescriptionSuggested) {
      e.preventDefault(); // Prevent default tab behavior
      setTaskDescription(suggestionText); // Set the suggestion as the actual value
      setIsDescriptionSuggested(false); // Suggestion is accepted
      setSuggestionText(""); // Clear the suggestion text
      // Optionally, move focus to the next input field (Duration)
    }
    // else if (isDescriptionSuggested && e.key !== 'Tab') {
    //   // If any other key is pressed while suggestion is active, turn off suggestion
    //   setIsDescriptionSuggested(false);
    //   setSuggestionText(''); // Clear the suggestion text
    //   // The character typed will be handled by the onChange event
    // }

    // Existing logic for arrow key navigation
    const inputs = [
      titleInputRef.current,
      descriptionInputRef.current,
      durationInputRef.current,
      emojiButtonRef.current,
    ].filter(Boolean);

    const currentIndex = inputs.findIndex(
      (input) => input === document.activeElement
    );

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % inputs.length;
      inputs[nextIndex].focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + inputs.length) % inputs.length;
      inputs[prevIndex].focus();
    } else if (e.key === "Enter") {
      e.preventDefault(); // Prevent default behavior to avoid double submission
      addTask();
    }
  };

  const handleKeyDown = (e) => {
    const inputs = [
      titleInputRef.current,
      descriptionInputRef.current,
      durationInputRef.current,
      emojiButtonRef.current,
    ].filter(Boolean); // Filter out any null refs

    const currentIndex = inputs.findIndex(
      (input) => input === document.activeElement
    );

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % inputs.length;
      inputs[nextIndex].focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + inputs.length) % inputs.length;
      inputs[prevIndex].focus();
    } else if (e.key === "Enter") {
      // Stop propagation to prevent the event from bubbling up
      e.stopPropagation();
      // Prevent default to avoid form submission
      e.preventDefault();
      // Call addTask only once
      addTask();
    }
  };

  // Handle emoji selection
  const onEmojiClick = (emojiObject) => {
    setTaskEmoji(emojiObject.emoji);
    setShowEmojiPicker(false); // Hide the picker after selection
  };

  // Add state for the currently active "Now" task
  // Initialize nowTask directly from localStorage
  const [nowTask, setNowTask] = useState(() => {
    const savedNowTask = localStorage.getItem("nowTask");
    return savedNowTask ? JSON.parse(savedNowTask) : null;
  });

  // Load tasks from localStorage on component mount
  const [laterTasks, setLaterTasks] = useState(() => {
    const savedTasks = localStorage.getItem("laterTasks");
    if (savedTasks) {
      return JSON.parse(savedTasks);
    } else {
      return [
        {
          id: 1,
          title: "First Task",
          description: "My first task's description is long, so long...",
          time: "0h 40m",
          emoji: "😃",
          priority: "Medium",
          tag: { name: "Personal life", color: "#6366F1" },
        },
        {
          id: 2,
          title: "Second Task",
          description: "My second task's description is long, so long...",
          time: "0h 10m",
          emoji: "🤔",
          priority: "Low",
          tag: { name: "Personal life", color: "#6366F1" },
        },
        {
          id: 3,
          title: "Third Task",
          description: "My third task's description is long, so long...",
          time: "1h 20m",
          emoji: "😎",
          priority: "High",
          tag: { name: "Personal life", color: "#6366F1" },
        },
      ];
    }
  });

  // Add state for archived tasks
  const [archivedTasks, setArchivedTasks] = useState(() => {
    const savedArchivedTasks = localStorage.getItem("archivedTasks");
    return savedArchivedTasks ? JSON.parse(savedArchivedTasks) : [];
  });

  const SortableItem = ({ task }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = // Add isDragging here
      useSortable({ id: task.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition: isDragging
        ? "none"
        : "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)", // Apply transition here
    };

    // Add state for menu visibility
    const [isMenuOpen, setIsMenuOpen] = useState(false);

      const handleContentChange = (e, field) => {
        const updatedValue = e.target.innerText;
        const updatedTasks = laterTasks.map((t) =>
          t.id === task.id ? { ...t, [field]: updatedValue } : t
        );
        setLaterTasks(updatedTasks);
        localStorage.setItem("laterTasks", JSON.stringify(updatedTasks));
      };

    // Toggle menu visibility
    // For SortableItem component
    const toggleMenu = () => {
      if (isMenuOpen) {
        // Get the menu element
        const menuElement = document.querySelector(
          `#task-${task.id} .task-card-menu`
        );
        if (menuElement) {
          // Add the fading-out class
          menuElement.classList.add("fading-out");
          // Wait for the animation to complete before hiding the menu
          setTimeout(() => {
            setIsMenuOpen(false);
          }, 300); // Match this with the animation duration (0.3s)
        } else {
          setIsMenuOpen(false);
        }
      } else {
        setIsMenuOpen(true);
      }
    };

    // Add state for emoji picker visibility

    // Handle moving a task to "Now"
    const handleMoveToNow = (taskId) => {
      // Find the task to move
      const taskToMove = laterTasks.find((task) => task.id === taskId);

      if (taskToMove) {
        // Check if there is an existing task in "Now"
        if (nowTask) {
          // If yes, move the current "Now" task back to "Later" tasks
          setLaterTasks((prevTasks) => [nowTask, ...prevTasks]); // Add it to the beginning of the later tasks list
        }

        // Set the selected task as the new "Now" task
        setNowTask(taskToMove);

        // Remove the selected task from "Later" tasks
        setLaterTasks((prevTasks) =>
          prevTasks.filter((task) => task.id !== taskId)
        );

        // Show notification
        showNotification("Nice pick buddy!");

        // Close the menu
        setIsMenuOpen(false);

        // Dispatch custom event to notify App.js about nowTask change
        window.dispatchEvent(
          new CustomEvent("nowTaskUpdated", {
            detail: taskToMove,
          })
        );
      }
    };

    // Add state for delete confirmation popup
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [isConfirmationClosing, setIsConfirmationClosing] = useState(false);

    // Function to show delete confirmation
    const showDeleteConfirm = (e) => {
      e.stopPropagation(); // Prevent event bubbling
      setShowDeleteConfirmation(true);
    };

    // Function to hide delete confirmation
    const hideDeleteConfirm = () => {
      setIsConfirmationClosing(true);
      setTimeout(() => {
        setShowDeleteConfirmation(false);
        setIsConfirmationClosing(false);
      }, 300); // Match with animation duration
    };

    // Function to confirm deletion
    const confirmDelete = (taskId) => {
      // Get the menu element
      const menuElement = document.querySelector(
        `#task-${taskId} .task-card-menu`
      );
      if (menuElement) {
        // Add the fading-out class
        menuElement.classList.add("fading-out");
        // Wait for the animation to complete before removing the task
        setTimeout(() => {
          // Remove the task from laterTasks
          setLaterTasks((prevTasks) =>
            prevTasks.filter((task) => task.id !== taskId)
          );
          // Show notification
          showNotification("Task deleted");
          // Close the menu
          setIsMenuOpen(false);
        }, 300); // Match this with the animation duration
      } else {
        // Remove the task from laterTasks
        setLaterTasks((prevTasks) =>
          prevTasks.filter((task) => task.id !== taskId)
        );
        // Show notification
        showNotification("Task deleted");
        // Close the menu
        setIsMenuOpen(false);
      }
    };

    // Add the handleArchiveTask function
    const handleArchiveTask = (taskId) => {
      // Find the task to archive
      const taskToArchive = laterTasks.find((task) => task.id === taskId);

      if (taskToArchive) {
        // Add to archived tasks
        setArchivedTasks((prevTasks) => [taskToArchive, ...prevTasks]);

        // Remove from later tasks
        setLaterTasks((prevTasks) =>
          prevTasks.filter((task) => task.id !== taskId)
        );

        // Show notification
        showNotification("Task archived");

        // Close the menu
        setIsMenuOpen(false);
      }
    };

    // Define the maximum length for the truncated description
    const maxDescriptionLength =
      "My second task's description is long is so long".length;

    // In the SortableItem component
    return (
      // Apply attributes to the main div
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={isDragging ? "is-dragging" : ""} // Add class when dragging
      >
        <div
          className={`later-tasks-card ${isMenuOpen ? "expanded" : ""}`}
          key={task.id}
          id={`task-${task.id}`}
        >
          <div className="later-tasks-card-top-row">
            <div className="later-tasks-card-emoji-text-container">
              <div className="later-tasks-card-emoji-container">
                {/* Apply listeners and cursor style to the SixDotsIcon */}
                <SixDotsIcon
                  className="later-tasks-card-emoji-dots"
                  {...listeners}
                  style={{ cursor: "grab" }}
                />
                {typeof task.emoji === "string" &&
                task.emoji.startsWith("http") ? (
                  <img
                    className="later-tasks-card-emoji"
                    src={task.emoji}
                    alt="emoji"
                  />
                ) : (
                  <span className="later-tasks-card-emoji-text">
                    {task.emoji}
                  </span>
                )}
              </div>
              <div className="later-tasks-card-text">
                <div className="later-tasks-card-title-div">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        backgroundColor:
                          task.priority === "High"
                            ? "#801220"
                            : task.priority === "Medium"
                            ? "#675C21"
                            : "#232526",
                      }}
                      className="task-priority-indecator"
                    ></div>
                    <p
                      suppressContentEditableWarning
                      contentEditable
                      onBlur={(e) => handleContentChange(e, "title")}
                      className="later-tasks-card-title"
                    >
                      {task.title}
                    </p>
                  </div>
                  <p
                    className="later-tasks-card-time"
                  >
                    {task.time}
                  </p>
                </div>
                <p
                  className="later-tasks-card-description"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleContentChange(e, "description")}
                >
                  {isMenuOpen || task.description.length <= maxDescriptionLength
                    ? task.description
                    : `${task.description.substring(
                        0,
                        maxDescriptionLength
                      )}...`}
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
              {/* Add onClick handler to the "move to Now" button */}
              <button
                className="menu-item"
                onClick={() => handleMoveToNow(task.id)}
              >
                <NowIcon className="menu-icon" /> move to Now
              </button>
              <button
                className="menu-item"
                onClick={() => handleArchiveTask(task.id)}
              >
                <ArchiveIcon className="menu-icon" /> archive
              </button>
              <div style={{ position: "relative" }}>
                <button
                  className="menu-item delete"
                  onClick={showDeleteConfirm}
                >
                  <BinIcon className="menu-icon" /> Delete
                </button>

                {/* Delete confirmation popup */}
                {showDeleteConfirmation && (
                  <div
                    className={`delete-confirmation-popup ${
                      isConfirmationClosing ? "fading-out" : ""
                    }`}
                  >
                    <p className="delete-confirmation-text">Are you sure?</p>
                    <div className="delete-confirmation-buttons">
                      <button
                        className="cancel-delete-button"
                        onClick={hideDeleteConfirm}
                      >
                        Cancel
                      </button>
                      <button
                        className="confirm-delete-button"
                        onClick={() => confirmDelete(task.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 2. In your component body, below states:
  const sensors = useSensors(useSensor(PointerSensor));

  // 3. Handle drag end:
  // Update the handleDragEnd function
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      // Check if the task is in laterTasks
      const laterTaskIndex = laterTasks.findIndex(
        (task) => task.id === active.id
      );
      const overLaterTaskIndex = laterTasks.findIndex(
        (task) => task.id === over?.id
      );

      // Check if the task is in archivedTasks
      const archivedTaskIndex = archivedTasks.findIndex(
        (task) => task.id === active.id
      );
      const overArchivedTaskIndex = archivedTasks.findIndex(
        (task) => task.id === over?.id
      );

      // If both tasks are in laterTasks, reorder laterTasks
      if (laterTaskIndex !== -1 && overLaterTaskIndex !== -1) {
        setLaterTasks((tasks) =>
          arrayMove(tasks, laterTaskIndex, overLaterTaskIndex)
        );
      }
      // If both tasks are in archivedTasks, reorder archivedTasks
      else if (archivedTaskIndex !== -1 && overArchivedTaskIndex !== -1) {
        setArchivedTasks((tasks) =>
          arrayMove(tasks, archivedTaskIndex, overArchivedTaskIndex)
        );
      }
    }
  };

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("laterTasks", JSON.stringify(laterTasks));
  }, [laterTasks]);

  // Keep the useEffect to save nowTask whenever it changes
  useEffect(() => {
    localStorage.setItem("nowTask", JSON.stringify(nowTask));
  }, [nowTask]); // Save whenever nowTask changes

  useEffect(() => {
    localStorage.setItem("taskTitle", taskTitle);
  }, [taskTitle]);

  useEffect(() => {
    localStorage.setItem("taskDescription", taskDescription);
  }, [taskDescription]);

  useEffect(() => {
    localStorage.setItem("taskDuration", taskDuration);
  }, [taskDuration]);

  useEffect(() => {
    localStorage.setItem("taskPriority", taskPriority);
  }, [taskPriority]);

  useEffect(() => {
    localStorage.setItem("taskEmoji", taskEmoji);
  }, [taskEmoji]);

  useEffect(() => {
    localStorage.setItem("taskTag", JSON.stringify(taskTag));
  }, [taskTag]);

  // Add cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "nowTask") {
        setNowTask(e.newValue ? JSON.parse(e.newValue) : null);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const modalContentRef = useRef(null);

  // Effect for 'Ctrl + N' key press to open modal

  // Search functionality
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const searchInputRef = useRef(null);
  const searchButtonRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Filter functionality
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null); // null means no filter
  const [filteredResults, setFilteredResults] = useState([]);

  const openModal = () => {
    // Use values from localStorage if they exist, otherwise use defaults
    setTaskTitle(localStorage.getItem("taskTitle") || "");
    setTaskDescription(localStorage.getItem("taskDescription") || "");
    setTaskDuration(localStorage.getItem("taskDuration") || "3h 45m");
    setTaskPriority(localStorage.getItem("taskPriority") || "Low");
    setTaskEmoji(localStorage.getItem("taskEmoji") || "😃");

    // For taskTag, we need to parse the JSON string
    const storedTag = localStorage.getItem("taskTag");
    setTaskTag(
      storedTag
        ? JSON.parse(storedTag)
        : {
            name: "Personal life",
            color: "#6366F1",
          }
    );
    setIsDescriptionSuggested(false);
    setSuggestionText("");

    setTimeout(() => {
      if (titleInputRef.current) {
        titleInputRef.current.focus();
      }
    }, 0);

    window.dispatchEvent(
      new CustomEvent("modal-state-change", {
        detail: { type: "modal", isOpen: true },
      })
    );

    setShowModal(true);
    setIsClosing(false);
  };

  useEffect(() => {
    const handleKeyPress = (event) => {
      if ((event.key === "t" || event.key === "T") && 
          !event.target.isContentEditable && 
          !['INPUT', 'TEXTAREA'].includes(event.target.tagName)) {
        openModal();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [openModal]); // Depend on openModal to ensure it's up-to-date

  const closeModal = (shouldReset = false) => {
    setIsClosing(true);
    setTimeout(() => {
      setShowModal(false);
      setIsClosing(false);
      if (shouldReset) {
        setTaskTitle("");
        setTaskDescription("");
        setTaskDuration("3h 45m");
        setTaskPriority("Low");
        setTaskEmoji("😃");
        setTaskTag({
          name: "Personal life",
          color: "#6366F1",
        });
        setIsDescriptionSuggested(false);
        setSuggestionText("");
      }
    }, 300); // Match this with the animation duration (0.3s)
    window.dispatchEvent(
      new CustomEvent("modal-state-change", {
        detail: { type: "modal", isOpen: false },
      })
    );
  };

  // Add a function to show notifications
  const showNotification = (message) => {
    // Create a new notification with unique ID
    const notificationId = Date.now();
    const newNotification = {
      id: notificationId,
      message: message,
    };

    // Add the new notification to the array (limit to 3)
    setNotifications((prevNotifications) => {
      // If we already have 3 notifications, remove the oldest one
      const updatedNotifications = [...prevNotifications];
      if (updatedNotifications.length >= 3) {
        const oldestId = updatedNotifications[0].id;
        // Clear the timeout for the oldest notification
        if (notificationTimeoutsRef.current[oldestId]) {
          clearTimeout(notificationTimeoutsRef.current[oldestId]);
          delete notificationTimeoutsRef.current[oldestId];
        }
        updatedNotifications.shift(); // Remove the oldest notification
      }
      return [...updatedNotifications, newNotification];
    });

    // Set timeout to remove this specific notification
    notificationTimeoutsRef.current[notificationId] = setTimeout(() => {
      setNotifications((prevNotifications) =>
        prevNotifications.filter(
          (notification) => notification.id !== notificationId
        )
      );
      delete notificationTimeoutsRef.current[notificationId];
    }, 2300);
  };

  // Clean up timeouts when component unmounts
  useEffect(() => {
    return () => {
      // Clear all notification timeouts
      Object.values(notificationTimeoutsRef.current).forEach((timeout) => {
        clearTimeout(timeout);
      });
    };
  }, []);

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

    // Request notification permission if not already granted
    if (Notification.permission !== "granted") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          console.log("Notification permission granted.");
        } else {
          console.log("Notification permission denied.");
        }
      });
    }

    // Create new task object
    const newTask = {
      id: Date.now(), // Use timestamp as unique ID
      title: taskTitle,
      description: taskDescription,
      time: taskDuration,
      emoji: taskEmoji,
      priority: taskPriority,
      tag: taskTag,
    };

    // Add to tasks array
    setLaterTasks((prevTasks) => [newTask, ...prevTasks]);

    // Reset form submitted state
    setFormSubmitted(false);

    // Close modal
    closeModal(true);
  };

  // Handle ESC key press
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        // Close the emoji picker if it's open
        if (showEmojiPicker) {
          setShowEmojiPicker(false);
        } else if (showModal) {
          closeModal(); // Close without resetting
        } else if (isSearchExpanded) {
          closeSearch();
        }
      }
    };

    window.addEventListener("keydown", handleEscKey);
    return () => {
      window.removeEventListener("keydown", handleEscKey);
    };
  }, [showModal, isSearchExpanded, showEmojiPicker]); // Add showEmojiPicker to dependencies

  // Handle click outside modal
  const handleOverlayClick = (event) => {
    // Close the emoji picker if it's open
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
      return; // Prevent closing the modal if only the emoji picker was clicked
    }

    if (
      modalContentRef.current &&
      !modalContentRef.current.contains(event.target)
    ) {
      closeModal(); // Close without resetting
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

  // Helper function to parse duration strings to minutes
  const parseDurationToMinutes = (timeString) => {
    if (!timeString) return 0;

    let totalMinutes = 0;
    const hourMatch = timeString.match(/(\d+)h/);
    const minuteMatch = timeString.match(/(\d+)m/);

    if (hourMatch && hourMatch[1]) {
      totalMinutes += parseInt(hourMatch[1]) * 60;
    }

    if (minuteMatch && minuteMatch[1]) {
      totalMinutes += parseInt(minuteMatch[1]);
    }

    return totalMinutes;
  };

  // Handle filter click
  const handleFilterClick = () => {
    setIsFilterMenuOpen(!isFilterMenuOpen);
  };

  // Apply a filter
  const applyFilter = (filterRange) => {
    setActiveFilter(filterRange);

    if (!filterRange) {
      // Clear filter
      setFilteredResults([]);
      setIsFilterMenuOpen(false);
      return;
    }

    let filteredTasks = [];

    switch (filterRange) {
      case "1m-10m":
        filteredTasks = laterTasks.filter((task) => {
          const minutes = parseDurationToMinutes(task.time);
          return minutes >= 1 && minutes <= 10;
        });
        break;
      case "10m-20m":
        filteredTasks = laterTasks.filter((task) => {
          const minutes = parseDurationToMinutes(task.time);
          return minutes > 10 && minutes <= 20;
        });
        break;
      case "20m-30m":
        filteredTasks = laterTasks.filter((task) => {
          const minutes = parseDurationToMinutes(task.time);
          return minutes > 20 && minutes <= 30;
        });
        break;
      case "30m+":
        filteredTasks = laterTasks.filter((task) => {
          const minutes = parseDurationToMinutes(task.time);
          return minutes > 30;
        });
        break;
      default:
        filteredTasks = [];
    }

    setFilteredResults(filteredTasks);
    setIsFilterMenuOpen(false);
    showNotification(`Fox filtered your focus: ${filterRange}`);
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

  // Save archived tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("archivedTasks", JSON.stringify(archivedTasks));
  }, [archivedTasks]);

  const toggleArchive = () => {
    if (isArchiveOpen) {
      // If we're closing the archive, animate it out
      const archiveSection = document.querySelector(".archive-section");
      if (archiveSection) {
        archiveSection.classList.remove("visible");
        archiveSection.classList.add("hidden");

        // Wait for animation to complete before updating state
        setTimeout(() => {
          setIsArchiveOpen(false);
        }, 400); // Match with animation duration
      } else {
        setIsArchiveOpen(false);
      }
    } else {
      // If we're opening the archive, update state immediately
      setIsArchiveOpen(true);
    }
  };

  // Add ArchivedTaskItem component for archived tasks
  // Replace the ArchivedTaskItem with SortableArchiveItem
  const SortableArchiveItem = ({ task }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = // Add isDragging here
      useSortable({ id: task.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    // Add state for menu visibility
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Toggle menu visibility
    // For SortableArchiveItem component
    const toggleMenu = () => {
      if (isMenuOpen) {
        // Get the menu element
        const menuElement = document.querySelector(
          `#archive-task-${task.id} .task-card-menu`
        );
        if (menuElement) {
          // Add the fading-out class
          menuElement.classList.add("fading-out");
          // Wait for the animation to complete before hiding the menu
          setTimeout(() => {
            setIsMenuOpen(false);
          }, 300); // Match this with the animation duration (0.3s)
        } else {
          setIsMenuOpen(false);
        }
      } else {
        setIsMenuOpen(true);
      }
    };

    // Handle restoring a task to Later
    const handleRestoreToLater = (taskId) => {
      // Find the task to restore
      const taskToRestore = archivedTasks.find((task) => task.id === taskId);

      if (taskToRestore) {
        // Add to later tasks
        setLaterTasks((prevTasks) => [taskToRestore, ...prevTasks]);

        // Remove from archived tasks
        setArchivedTasks((prevTasks) =>
          prevTasks.filter((task) => task.id !== taskId)
        );

        // Show notification
        showNotification("Task restored to Later");

        // Close the menu
        setIsMenuOpen(false);
      }
    };

    // Handle moving a task from Archive to Now
    const handleMoveToNowFromArchive = (taskId) => {
      // Find the task to move
      let taskToMove = archivedTasks.find((task) => task.id === taskId);

      if (taskToMove) {
        // Check if there is an existing task in "Now"
        if (nowTask) {
          // If yes, move the current "Now" task back to "Later" tasks
          setLaterTasks((prevTasks) => [nowTask, ...prevTasks]); // Add it to the beginning of the later tasks list
        }

        // Set the selected task as the new "Now" task
        setNowTask(taskToMove);

        // Remove the selected task from archived tasks
        setArchivedTasks((prevTasks) =>
          prevTasks.filter((task) => task.id !== taskId)
        );

        // Show notification
        showNotification("Task revived!");

        // Close the menu
        setIsMenuOpen(false);

        // Dispatch custom event to notify App.js about nowTask change
        window.dispatchEvent(
          new CustomEvent("nowTaskUpdated", {
            detail: taskToMove,
          })
        );
      }
    };

    // Add state for delete confirmation popup
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [isConfirmationClosing, setIsConfirmationClosing] = useState(false);

    // Function to show delete confirmation
    const showDeleteConfirm = (e) => {
      e.stopPropagation(); // Prevent event bubbling
      setShowDeleteConfirmation(true);
    };

    // Function to hide delete confirmation
    const hideDeleteConfirm = () => {
      setIsConfirmationClosing(true);
      setTimeout(() => {
        setShowDeleteConfirmation(false);
        setIsConfirmationClosing(false);
      }, 300); // Match with animation duration
    };

    // Function to confirm deletion
    const confirmDelete = (taskId) => {
      // Remove the task from archivedTasks
      setArchivedTasks((prevTasks) =>
        prevTasks.filter((task) => task.id !== taskId)
      );

      // Show notification
      showNotification("Task deleted");

      // Close the menu
      setIsMenuOpen(false);
    };

    // Define the maximum length for the truncated description
    const maxDescriptionLength = " task's description is long, so long..."
      .length;

        const handleContentChange = (e, field) => {
          const updatedValue = e.target.innerText;
          const updatedTasks = archivedTasks.map((t) =>
            t.id === task.id ? { ...t, [field]: updatedValue } : t
          );
          setArchivedTasks(updatedTasks);
          localStorage.setItem("archivedTasks", JSON.stringify(updatedTasks));
        };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={isDragging ? "is-dragging" : ""} // Add class when dragging
      >
        <div
          className={`later-tasks-card ${isMenuOpen ? "expanded" : ""}`}
          key={task.id}
          id={`archive-task-${task.id}`}
        >
          <div className="later-tasks-card-top-row">
            <div className="later-tasks-card-emoji-text-container">
              <div className="later-tasks-card-emoji-container">
                <SixDotsIcon
                  className="later-tasks-card-emoji-dots"
                  {...listeners}
                  style={{ cursor: "grab" }}
                />
                {typeof task.emoji === "string" &&
                task.emoji.startsWith("http") ? (
                  <img
                    className="later-tasks-card-emoji"
                    src={task.emoji}
                    alt="emoji"
                  />
                ) : (
                  <span className="later-tasks-card-emoji-text">
                    {task.emoji}
                  </span>
                )}
              </div>
              <div className="later-tasks-card-text">
                <div className="later-tasks-card-title-div">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        backgroundColor:
                          task.priority === "High"
                            ? "#801220"
                            : task.priority === "Medium"
                            ? "#675C21"
                            : "#232526",
                      }}
                      className="task-priority-indecator"
                    ></div>
                    <p
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => handleContentChange(e, "title")}
                      className="later-tasks-card-title"
                    >
                      {task.title}
                    </p>
                  </div>
                  <p className="later-tasks-card-time">{task.time}</p>
                </div>
                <p
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleContentChange(e, "description")}
                  className="later-tasks-card-description"
                >
                  {isMenuOpen || task.description.length <= maxDescriptionLength
                    ? task.description
                    : `${task.description.substring(
                        0,
                        maxDescriptionLength
                      )}...`}
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
              <button
                className="menu-item"
                onClick={() => handleMoveToNowFromArchive(task.id)}
              >
                <NowIcon className="menu-icon" /> Move to Now
              </button>
              <button
                className="menu-item"
                onClick={() => handleRestoreToLater(task.id)}
              >
                <LaterIcon className="menu-icon" /> Restore to Later
              </button>
              <div style={{ position: "relative" }}>
                <button
                  className="menu-item delete"
                  onClick={showDeleteConfirm}
                >
                  <BinIcon className="menu-icon" /> Delete
                </button>

                {/* Delete confirmation popup */}
                {showDeleteConfirmation && (
                  <div
                    className={`delete-confirmation-popup ${
                      isConfirmationClosing ? "fading-out" : ""
                    }`}
                  >
                    <p className="delete-confirmation-text">Are you sure?</p>
                    <div className="delete-confirmation-buttons">
                      <button
                        className="cancel-delete-button"
                        onClick={hideDeleteConfirm}
                      >
                        Cancel
                      </button>
                      <button
                        className="confirm-delete-button"
                        onClick={() => confirmDelete(task.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      className="tasks-page-container"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Render stacked notifications */}
      <div className="notifications-container">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              className="task-notification"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <LogoIcon className="notification-logo" />
              {notification.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {/* Pass the nowTask to the TimerWhiteNoises component */}
      <div className="right-section">
        <div className="now-tasks-container">
          <div className="now-tasks-text">
            <NowIcon className="now-icon" />
            <p className="now-tasks">Now</p>
          </div>
          {/* Conditionally render the Now task card based on nowTask state */}
          {nowTask ? (
            <div className="now-tasks-card">
              <div className="now-tasks-card-emoji-text-container">
                {typeof nowTask.emoji === "string" &&
                nowTask.emoji.startsWith("http") ? (
                  <img
                    className="now-tasks-card-emoji"
                    src={nowTask.emoji}
                    alt="emoji"
                  />
                ) : (
                  <span className="now-tasks-card-emoji-text">
                    {nowTask.emoji}
                  </span>
                )}
                <div className="now-tasks-card-text">
                  <div className="now-tasks-card-title-div">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          backgroundColor:
                            nowTask.priority === "High"
                              ? "#801220"
                              : nowTask.priority === "Medium"
                              ? "#675C21"
                              : "#232526",
                        }}
                        className="task-priority-indecator"
                      ></div>
                      <p className="later-tasks-card-title">{nowTask.title}</p>
                    </div>
                    <p className="now-tasks-card-time">{nowTask.time}</p>
                  </div>
                  <p className="now-tasks-card-description">
                    {nowTask.description}
                  </p>
                </div>
              </div>
              {/* Add a button or icon to clear the Now task if needed */}
              {/* <button onClick={() => setNowTask(null)}>Clear</button> */}
              {/* Keep the arrow if needed */}
            </div>
          ) : (
            <div className="now-tasks-no-task">
              <LogoIcon className="now-tasks-no-task-logo" />
              <p className="now-tasks-no-task-title">
                I’m bored! Pick something for us to do!
              </p>
            </div>
          )}
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
                <div
                  className="filter-container"
                  style={{ position: "relative" }}
                >
                  <button
                    className={`filter-button ${activeFilter ? "active" : ""}`}
                    onClick={handleFilterClick}
                  >
                    <FilterIcon className="filter-icon" />
                  </button>
                  <AnimatePresence>
                    {isFilterMenuOpen && (
                      <motion.div
                        initial={{ y: -20, opacity: 0, filter: "blur(8px)" }}
                        animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                        exit={{ y: -20, opacity: 0, filter: "blur(8px)" }} // Fade-out animation
                        transition={{ duration: 0.3 }}
                        className="filter-menu"
                      >
                        <div className="filter-menu-header">
                          Filter by duration
                        </div>
                        <button
                          className={`filter-option ${
                            activeFilter === "1m-10m" ? "active" : ""
                          }`}
                          onClick={() => applyFilter("1m-10m")}
                        >
                          1m - 10m
                        </button>
                        <button
                          className={`filter-option ${
                            activeFilter === "10m-20m" ? "active" : ""
                          }`}
                          onClick={() => applyFilter("10m-20m")}
                        >
                          10m - 20m
                        </button>
                        <button
                          className={`filter-option ${
                            activeFilter === "20m-30m" ? "active" : ""
                          }`}
                          onClick={() => applyFilter("20m-30m")}
                        >
                          20m - 30m
                        </button>
                        <button
                          className={`filter-option ${
                            activeFilter === "30m+" ? "active" : ""
                          }`}
                          onClick={() => applyFilter("30m+")}
                        >
                          30m+
                        </button>
                        {activeFilter && (
                          <button
                            className="filter-option clear"
                            onClick={() => applyFilter(null)}
                          >
                            Clear filter
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="tooltip-wrap">
                <div className="tooltip-button">T</div>
                <button className="add-task-CTA" onClick={openModal}>
                  <PlusIcon className="add-task-icon" />
                  <p className="add-task-text">Add Task</p>
                </button>
              </div>
            </div>
          </div>

          {/* Display search results, filtered results, or regular tasks */}
          {searchQuery.trim() !== "" && searchResults.length > 0 ? (
            <div className="search-results-container">
              {/* Use SortableItem for search results as well for consistency */}
              {searchResults.map((task) => (
                <SortableItem key={task.id} task={task} />
              ))}
            </div>
          ) : searchQuery.trim() !== "" && searchResults.length === 0 ? (
            <div className="no-results">No tasks found</div>
          ) : activeFilter && filteredResults.length > 0 ? (
            <div className="filtered-results-container">
              {/* Display filtered tasks */}
              {filteredResults.map((task) => (
                <SortableItem key={task.id} task={task} />
              ))}
            </div>
          ) : activeFilter && filteredResults.length === 0 ? (
            <div className="no-results">No tasks match the selected filter</div>
          ) : (
            // Regular tasks (only shown when not searching or filtering)
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={laterTasks.map((task) => task.id)}
                strategy={verticalListSortingStrategy}
              >
                {laterTasks.length > 0 ? (
                  laterTasks.map((task) => (
                    <SortableItem key={task.id} task={task} />
                  ))
                ) : (
                  <div className="now-tasks-no-task">
                    <LogoIcon className="now-tasks-no-task-logo" />
                    <p className="now-tasks-no-task-title">
                      Nothing left to do — go enjoy a snack!
                    </p>
                  </div>
                )}
              </SortableContext>
            </DndContext>
          )}
        </div>
        {/* Archive section */}
        <div
          className="archive-header"
          style={{
            marginTop: "24px",
            display: "flex",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <p className="archive-header-text" onClick={toggleArchive}>
            Archive ({archivedTasks.length})
          </p>
        </div>

        <motion.div
          className={`archive-section${isArchiveOpen ? " visible" : " hidden"}`}
          initial={{ height: 0, opacity: 0 }}
          animate={{
            height: isArchiveOpen ? "auto" : 0,
            opacity: isArchiveOpen ? 1 : 0,
          }}
          transition={{ duration: 0.4 }}
        >
          {isArchiveOpen && (
            <>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={archivedTasks.map((task) => task.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {archivedTasks.length > 0 ? (
                    archivedTasks.map((task) => (
                      <SortableArchiveItem key={task.id} task={task} />
                    ))
                  ) : (
                    <div className="now-tasks-no-task">
                      <LogoIcon className="now-tasks-no-task-logo" />
                      <p className="now-tasks-no-task-title">
                        No retired tasks — keep on moving!
                      </p>
                    </div>
                  )}
                </SortableContext>
              </DndContext>
            </>
          )}
        </motion.div>
      </div>

      {/* Task Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className={`modal-overlay${isClosing ? " closing" : ""}`}
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleOverlayClick}
          >
            <motion.div
              className={`modal-content${isClosing ? " closing" : ""}`}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.3 }}
              ref={modalContentRef}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addTask();
                }}
              >
                <div className="modal-header">
                  <h2>Add task</h2>
                  <button
                    type="button"
                    className="close-button"
                    onClick={closeModal}
                  >
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
                      onChange={handleTitleChange}
                      ref={titleInputRef}
                      onKeyDown={handleKeyDown}
                    />
                    {formSubmitted && errors.title && (
                      <p className="error-message">{errors.title}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      placeholder={
                        isDescriptionSuggested
                          ? suggestionText
                          : "My first task's description..."
                      } // Use suggestionText as placeholder
                      className={`modal-input ${
                        formSubmitted && errors.description ? "input-error" : ""
                      }`}
                      rows="2"
                      maxLength={60} // Limit description length to 150 characters
                      value={taskDescription} // Value is the actual input
                      onChange={handleDescriptionChange}
                      onKeyDown={handleDescriptionKeyDown}
                      ref={descriptionInputRef}
                    ></textarea>
                    {formSubmitted && errors.description && (
                      <p className="error-message">{errors.description}</p>
                    )}
                  </div>

                  <div className="form-row">
                    {/* <div className="form-group half">
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
                    </div> */}

                    <div className="form-group half">
                      <label>Duration</label>
                      <input
                        type="text"
                        className="modal-input"
                        value={taskDuration}
                        onChange={(e) => setTaskDuration(e.target.value)}
                        ref={durationInputRef}
                        onKeyDown={handleKeyDown}
                      />
                    </div>

                    <div className="form-group half">
                      <label htmlFor="priority">Priority</label>
                      <select
                        id="priority"
                        className="modal-input"
                        value={taskPriority}
                        onChange={(e) => setTaskPriority(e.target.value)}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    {/* <div className="form-group half">
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
                    </div> */}

                    <div className="form-group half">
                      <label>Emoji</label>
                      <div style={{ position: "relative" }}>
                        <button
                          type="button"
                          className="emoji-selector"
                          onClick={(e) => {
                            e.preventDefault();
                            setShowEmojiPicker(!showEmojiPicker);
                          }}
                          ref={emojiButtonRef}
                        >
                          {taskEmoji}
                        </button>

                        {showEmojiPicker && (
                          <motion.div
                            style={{
                              position: "absolute",
                              zIndex: 1000,
                              // Change 'top' to 'bottom' and adjust the value
                              bottom: "45px", // Adjust this value as needed for spacing
                              right: "0px",
                            }}
                          >
                            <EmojiPicker
                              onEmojiClick={onEmojiClick}
                              width={300}
                              height={400}
                              searchPlaceholder="Search emoji..."
                            />
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => closeModal(true)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="add-task-button">
                    <PlusIcon className="add-task-popup-icon" />
                    Add Task
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Tasks;



