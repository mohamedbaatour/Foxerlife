import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./Tasks.css";
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
import { ReactComponent as AIIcon } from "../icones/AI.svg";

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

import EmojiPicker, { EmojiStyle } from "emoji-picker-react";

import dayjs from "dayjs";
import { TimePicker } from "antd";

import DurationPicker from 'react-duration-picker';



const Tasks = ({ isTimerActive }) => {

  const parseDuration = (str) => {
    if (!str || typeof str !== "string") return { hours: 0, minutes: 0 };
  
    const hoursMatch = str.match(/(\d+)\s*h/);
    const minutesMatch = str.match(/(\d+)\s*m/);
  
    const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
  
    return {
      hours: isNaN(hours) ? 0 : hours,
      minutes: isNaN(minutes) ? 0 : minutes,
    };
  };




// helper to convert { hours: 1, minutes: 30 } to "1h 30m"
const formatDuration = (d) => `${d.hour()}h ${d.minute()}m`;
  
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState(
    localStorage.getItem("taskTitle") || ""
  );
  const [taskDescription, setTaskDescription] = useState(
    localStorage.getItem("taskDescription") || ""
  );
  const [isDescriptionSuggested, setIsDescriptionSuggested] = useState(false);
  const [suggestionText, setSuggestionText] = useState("");

  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const debounceTimeout = useRef(null);

  // const [taskDuration, setTaskDuration] = useState(() => {
  //   const defaultTaskLength = localStorage.getItem("defaultTaskLength");
  //   if (defaultTaskLength === "25") {
  //     return "0h 25m";
  //   } else if (defaultTaskLength === "50") {
  //     return "0h 50m";
  //   }
  //   return "3h 45m";
  // });

  const [duration, setDuration] = useState(dayjs().hour(0).minute(0));


 

  // useEffect(() => {
  //   const parsed = parseDuration(taskDuration);
  //   if (
  //     parsed &&
  //     (parsed.hours !== durationObj.hours || parsed.minutes !== durationObj.minutes)
  //   ) {
  //     setDurationObj(parsed);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [taskDuration]); 
  

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

  const [notifications, setNotifications] = useState([]);
  const notificationTimeoutsRef = useRef({});

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const titleInputRef = useRef(null);
  const descriptionInputRef = useRef(null);
  const durationInputRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const filterButtonRef = useRef(null);
  

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

    if (content.startsWith('"') && content.endsWith('"')) {
      content = content.slice(1, -1);
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

    const validPriorities = ["Low", "Medium", "High"];
    if (validPriorities.includes(content)) {
      return content;
    }

    return "Low";
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

    const emojiMatch = content.match(/[\p{Emoji}]/u);
    return emojiMatch ? emojiMatch[0] : "😃";
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

    content = content.replace(/^"|"$/g, "");
    return content.match(/^(\d+h\s*)?(\d+m)?$/) ? content : "1h";
  };

  const handleTitleChange = (e) => {
    const value = e.target.value;
    setTaskTitle(value);

    clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(async () => {
      if (value.length > 3 && taskDescription.trim() === "") {
        setIsGeneratingDesc(true);
        const suggestion = await generateDescription(value);
        setSuggestionText(suggestion);
        setTaskDescription("");
        setIsDescriptionSuggested(true);
        setIsGeneratingDesc(false);
        setDescChroma(true);
        setTimeout(() => setDescChroma(false), 900); // Reset after animation
      }

      const suggestedEmoji = await generateEmoji(value);
      setTaskEmoji(suggestedEmoji);

      if (value.length > 3) {
        const suggestedDuration = await estimateDuration(value);
        // Parse "1h 30m" to dayjs object
        const parsed = parseDuration(suggestedDuration);
        setDuration(dayjs().hour(parsed.hours).minute(parsed.minutes));
        setDurationChroma(true);
        setTimeout(() => setDurationChroma(false), 900);
      }
      const aiPriority = await generatePriority(value);
      setTaskPriority(aiPriority);
      localStorage.setItem("taskPriority", aiPriority);
      setPriorityChroma(true);
      setTimeout(() => setPriorityChroma(false), 900);
    }, 1000);
  };

  const handleDescriptionChange = (e) => {
    if (isDescriptionSuggested) {
      setIsDescriptionSuggested(false);
      setSuggestionText("");
    }
    setTaskDescription(e.target.value);
  };

  const handleDescriptionKeyDown = (e) => {
    if (e.key === "Tab" && isDescriptionSuggested) {
      e.preventDefault();
      setTaskDescription(suggestionText);
      setIsDescriptionSuggested(false);
      setSuggestionText("");
    }

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
      e.preventDefault();
      addTask();
    }
  };

  const handleKeyDown = (e) => {
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
      e.stopPropagation();
      e.preventDefault();
      addTask();
    }
  };

  const onEmojiClick = (emojiObject) => {
    setTaskEmoji(emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const [nowTask, setNowTask] = useState(() => {
    const savedNowTask = localStorage.getItem("nowTask");
    return savedNowTask ? JSON.parse(savedNowTask) : null;
  });

  const [removingTaskId, setRemovingTaskId] = useState(null);

  const [laterTasks, setLaterTasks] = useState(() => {
    const savedTasks = localStorage.getItem("laterTasks");
    if (savedTasks) {
      return JSON.parse(savedTasks);
    } else {
      return [
        {
          id: 1,
          title: "First Task",
          description: "My first task's description is long, so long",
          time: "0h 40m",
          emoji: "😃",
          priority: "Medium",
          tag: { name: "Personal life", color: "#6366F1" },
        },
        {
          id: 2,
          title: "Second Task",
          description: "My second task's description is long, so long",
          time: "0h 10m",
          emoji: "🤔",
          priority: "Low",
          tag: { name: "Personal life", color: "#6366F1" },
        },
        {
          id: 3,
          title: "Third Task",
          description: "My third task's description is long, so long",
          time: "1h 20m",
          emoji: "😎",
          priority: "High",
          tag: { name: "Personal life", color: "#6366F1" },
        },
      ];
    }
  });

  const [archivedTasks, setArchivedTasks] = useState(() => {
    const savedArchivedTasks = localStorage.getItem("archivedTasks");
    return savedArchivedTasks ? JSON.parse(savedArchivedTasks) : [];
  });

  const [isDragging, setIsDragging] = useState(false);

  const menuVariants = {
    hidden: { opacity: 0, pointerEvents: "none" },
    visible: { opacity: 1, pointerEvents: "auto" },
    exit: { opacity: 0, pointerEvents: "none" },
  };

  const SortableItem = ({ task }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: task.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition: isDragging
        ? "none"
        : "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
    };

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    const handleContentChange = (e, field) => {
      const updatedValue = e.target.innerText;
      const updatedTasks = laterTasks.map((t) =>
        t.id === task.id ? { ...t, [field]: updatedValue } : t
      );
      setLaterTasks(updatedTasks);
      localStorage.setItem("laterTasks", JSON.stringify(updatedTasks));
    };
    

    const handleMoveToNow = (taskId) => {
      setRemovingTaskId(taskId);
      setTimeout(() => {
        setLaterTasks((prevTasks) => {
          const filtered = prevTasks.filter((task) => task.id !== taskId);
          return nowTask ? [nowTask, ...filtered] : filtered;
        });
        const taskToMove = laterTasks.find((task) => task.id === taskId);
        if (taskToMove) {
          setNowTask(taskToMove);
          showNotification("Nice pick buddy!");
          setIsMenuOpen(false);
          window.dispatchEvent(
            new CustomEvent("nowTaskUpdated", { detail: taskToMove })
          );
        }
        setRemovingTaskId(null);
      }, 300);
    };

    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [isConfirmationClosing, setIsConfirmationClosing] = useState(false);

    const showDeleteConfirm = (e) => {
      e.stopPropagation();
      setShowDeleteConfirmation(true);
    };

    const hideDeleteConfirm = () => {
      setIsConfirmationClosing(true);

        setShowDeleteConfirmation(false);
        setIsConfirmationClosing(false);

    };

    const confirmDelete = (taskId) => {
      const menuElement = document.querySelector(
        `#task-${taskId} .task-card-menu`
      );
      if (menuElement) {
        menuElement.classList.add("fading-out");

          // Update laterTasks, searchResults, and filteredResults
          setLaterTasks((prevTasks) =>
            prevTasks.filter((task) => task.id !== taskId)
          );
          setSearchResults((prevResults) =>
            prevResults.filter((task) => task.id !== taskId)
          );
          setFilteredResults((prevFiltered) =>
            prevFiltered.filter((task) => task.id !== taskId)
          );
          showNotification("Task deleted");
          setIsMenuOpen(false);

      } else {
        setLaterTasks((prevTasks) =>
          prevTasks.filter((task) => task.id !== taskId)
        );
        setSearchResults((prevResults) =>
          prevResults.filter((task) => task.id !== taskId)
        );
        setFilteredResults((prevFiltered) =>
          prevFiltered.filter((task) => task.id !== taskId)
        );
        showNotification("Task deleted");
        setIsMenuOpen(false);
      }
    };

    const handleArchiveTask = (taskId) => {
      const taskToArchive = laterTasks.find((task) => task.id === taskId);

      if (taskToArchive) {
        setArchivedTasks((prevTasks) => [taskToArchive, ...prevTasks]);

        setLaterTasks((prevTasks) =>
          prevTasks.filter((task) => task.id !== taskId)
        );

        showNotification("Task archived");

        setIsMenuOpen(false);
      }
    };

    const maxDescriptionLength =
      "My second task's description is long is so lo".length;

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={isDragging ? "is-dragging" : ""}
      > 
        <div
          className={`later-tasks-card`}
          key={task.id}
          id={`task-${task.id}`}
          onMouseEnter={() => !isDragging && setIsMenuOpen(true)}
          onMouseLeave={() => setIsMenuOpen(false)}
        >
            <div className="later-tasks-card-emoji-text-container">
              <div className="later-tasks-card-emoji-container">
                <SixDotsIcon
                  className="later-tasks-card-emoji-dots"
                  {...listeners}
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
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        color:
                          task.priority === "High"
                            ? "#801220"
                            : task.priority === "Medium"
                            ? "#675C21"
                            : "#666666",
                        // backgroundColor:
                        //   task.priority === "High"
                        //     ? "#cc4d4d"
                        //     : task.priority === "Medium"
                        //     ? "#675C21"
                        //     : "#a1a1a1",
                      }}
                      className="task-priority-container"
                    >
                      <div
                        style={{
                          backgroundColor:
                            task.priority === "High"
                              ? "#801220"
                              : task.priority === "Medium"
                              ? "#675C21"
                              : "#666666",
                        }}
                        className="task-priority-indecator"
                      />
                      {task.priority}
                    </div>
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
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleContentChange(e, "time")}
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



          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                className="task-card-menu"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={menuVariants}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                
              >
                <button
                  className="menu-item"
                  onClick={() => handleMoveToNow(task.id)}
                >
                  <NowIcon className="menu-icon" /> Do Now
                </button>
                <button
                  className="menu-item"
                  onClick={() => handleArchiveTask(task.id)}
                >
                  <ArchiveIcon className="menu-icon" /> Archive
                </button>
                <div style={{ position: "relative" }}>
                  <button
                    className="menu-item delete"
                    onClick={showDeleteConfirm}
                  >
                    <BinIcon className="menu-icon" /> Delete
                  </button>

                  <AnimatePresence>
                    {showDeleteConfirmation && (
                      <motion.div
                        className={`delete-confirmation-popup`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );

  };

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    // Move from Later to Now (if Now is empty and dropped on the Now card)
    if (
      nowTask === null &&
      laterTasks.some((t) => t.id === active.id) &&
      over.id === "now-task-dropzone"
    ) {
      const movedTask = laterTasks.find((t) => t.id === active.id);
      if (movedTask) {
        setNowTask(movedTask);
        setLaterTasks((tasks) => tasks.filter((t) => t.id !== active.id));
        showNotification("Nice pick buddy!");
      }
      return;
    }

    // Move from Now to Later (if dropped on the Later container)
    if (
      nowTask &&
      active.id === nowTask.id &&
      over.id === "later-tasks-dropzone"
    ) {
      setLaterTasks((tasks) => [nowTask, ...tasks]);
      setNowTask(null);
      showNotification("Moved back to Later");
      return;
    }

    // Reorder within Later
    const laterTaskIndex = laterTasks.findIndex((task) => task.id === active.id);
    const overLaterTaskIndex = laterTasks.findIndex((task) => task.id === over.id);
    if (laterTaskIndex !== -1 && overLaterTaskIndex !== -1) {
      setLaterTasks((tasks) => arrayMove(tasks, laterTaskIndex, overLaterTaskIndex));
    }
  };

  useEffect(() => {
    localStorage.setItem("laterTasks", JSON.stringify(laterTasks));
  }, [laterTasks]);

  useEffect(() => {
    localStorage.setItem("nowTask", JSON.stringify(nowTask));
  }, [nowTask]);

  useEffect(() => {
    localStorage.setItem("taskTitle", taskTitle);
  }, [taskTitle]);

  useEffect(() => {
    localStorage.setItem("taskDescription", taskDescription);
  }, [taskDescription]);
  
  useEffect(() => {
  localStorage.setItem("taskDuration", duration.format("HH:mm"));
  }, [duration]);

  useEffect(() => {
    localStorage.setItem("taskPriority", taskPriority);
  }, [taskPriority]);

  useEffect(() => {
    localStorage.setItem("taskEmoji", taskEmoji);
  }, [taskEmoji]);

  useEffect(() => {
    localStorage.setItem("taskTag", JSON.stringify(taskTag));
  }, [taskTag]);

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

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const searchInputRef = useRef(null);
  const searchButtonRef = useRef(null);
  const searchContainerRef = useRef(null);

  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [filteredResults, setFilteredResults] = useState([]);

  const openModal = () => {
    setTaskTitle(localStorage.getItem("taskTitle") || "");
    setTaskDescription(localStorage.getItem("taskDescription") || "");

    let durationObjFromStorage = { hours: 3, minutes: 45 };
    const raw = localStorage.getItem("taskDuration");
    if (raw && raw !== "undefined" && raw !== "null" && raw !== "") {
      try {
        const parsed = JSON.parse(raw);
        if (
          typeof parsed === "object" &&
          parsed !== null &&
          typeof parsed.hours === "number" &&
          typeof parsed.minutes === "number"
        ) {
          durationObjFromStorage = parsed;
        } else if (typeof parsed === "string") {
          const hourMatch = parsed.match(/(\d+)h/);
          const minuteMatch = parsed.match(/(\d+)m/);
          durationObjFromStorage = {
            hours: hourMatch ? parseInt(hourMatch[1]) : 0,
            minutes: minuteMatch ? parseInt(minuteMatch[1]) : 0,
          };
        }
      } catch (err) {
        const hourMatch = raw.match(/(\d+)h/);
        const minuteMatch = raw.match(/(\d+)m/);
        durationObjFromStorage = {
          hours: hourMatch ? parseInt(hourMatch[1]) : 0,
          minutes: minuteMatch ? parseInt(minuteMatch[1]) : 0,
        };
      }
    }
    if (
      !durationObjFromStorage ||
      typeof durationObjFromStorage.hours !== "number" ||
      typeof durationObjFromStorage.minutes !== "number"
    ) {
      durationObjFromStorage = { hours: 3, minutes: 45 };
    }


    setTaskPriority(localStorage.getItem("taskPriority") || "Low");
    setTaskEmoji(localStorage.getItem("taskEmoji") || "😃");

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
      if (
        (event.key === "t" || event.key === "T") &&
        !event.target.isContentEditable &&
        !["INPUT", "TEXTAREA"].includes(event.target.tagName)
      ) {
        openModal();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [openModal]);

  const closeModal = (shouldReset = false) => {
    setIsClosing(true);

    setShowModal(false);
    setIsClosing(false);
    if (shouldReset) {
      setTaskTitle("");
      setTaskDescription("");
      setDuration(dayjs().hour(0).minute(0));
      setTaskPriority("Low");
      setTaskEmoji("😃");
      setTaskTag({
        name: "Personal life",
        color: "#6366F1",
      });
      setIsDescriptionSuggested(false);
      setSuggestionText("");
    }
    window.dispatchEvent(
      new CustomEvent("modal-state-change", {
        detail: { type: "modal", isOpen: false },
      })
    );
  };

  const showNotification = (message) => {
    const notificationId = Date.now();
    const newNotification = {
      id: notificationId,
      message: message,
    };

    setNotifications((prevNotifications) => {
      const updatedNotifications = [...prevNotifications];
      if (updatedNotifications.length >= 3) {
        const oldestId = updatedNotifications[0].id;
        if (notificationTimeoutsRef.current[oldestId]) {
          clearTimeout(notificationTimeoutsRef.current[oldestId]);
          delete notificationTimeoutsRef.current[oldestId];
        }
        updatedNotifications.shift();
      }
      return [...updatedNotifications, newNotification];
    });

    notificationTimeoutsRef.current[notificationId] = setTimeout(() => {
      setNotifications((prevNotifications) =>
        prevNotifications.filter(
          (notification) => notification.id !== notificationId
        )
      );
      delete notificationTimeoutsRef.current[notificationId];
    }, 2300);
  };

  useEffect(() => {
    return () => {
      Object.values(notificationTimeoutsRef.current).forEach((timeout) => {
        clearTimeout(timeout);
      });
    };
  }, []);

  const [errors, setErrors] = useState({
    title: "",
    description: "",
  });

  const [formSubmitted, setFormSubmitted] = useState(false);

  const addTask = () => {
    setFormSubmitted(true);

    const newErrors = {
      title: "",
      description: "",
    };

    let isValid = true;

    if (!taskTitle.trim()) {
      newErrors.title = "Please enter a task title";
      isValid = false;
    }


    if (!duration || (duration.hour() === 0 && duration.minute() === 0)) {
      newErrors.duration = "Please enter a valid duration";
      isValid = false;
    }
    

    // if (!taskDuration.trim()) {
    //   newErrors.duration = "Please enter a task duration";
    //   isValid = false;
    // }

    setErrors(newErrors);

    if (!isValid) return;

    if (Notification.permission !== "granted") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          console.log("Notification permission granted.");
        } else {
          console.log("Notification permission denied.");
        }
      });
    }

    const newTask = {
      id: Date.now(),
      title: taskTitle,
      description: taskDescription.trim() || "There is no description for this task.",
      time: formatDuration(duration),
      emoji: taskEmoji,
      priority: taskPriority,
      tag: taskTag,
    };

    setLaterTasks((prevTasks) => [newTask, ...prevTasks]);
    setFormSubmitted(false);
    closeModal(true);
  };

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        if (showEmojiPicker) {
          setShowEmojiPicker(false);
        } else if (showModal) {
          closeModal();
        } else if (isSearchExpanded) {
          closeSearch();
        } else if (isFilterMenuOpen) {
          setIsFilterMenuOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleEscKey);
    return () => {
      window.removeEventListener("keydown", handleEscKey);
    };
  }, [showModal, isSearchExpanded, showEmojiPicker]);

  const handleOverlayClick = (event) => {
    // If the user is selecting text inside an input or textarea, don't close
    const active = document.activeElement;
    if (
      (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) &&
      (typeof active.selectionStart === "number" && typeof active.selectionEnd === "number") &&
      active.selectionStart !== active.selectionEnd
    ) {
      return;
    }

    // For contenteditable (e.g., if you use it in your modal)
    const selection = window.getSelection();
    if (
      selection &&
      selection.toString().length > 0 &&
      (selection.anchorNode && selection.anchorNode.parentElement &&
        selection.anchorNode.parentElement.closest('.modal-content'))
    ) {
      return;
    }

    if (showEmojiPicker) {
      setShowEmojiPicker(false);
      return;
    }

    // Prevent closing if click is inside the TimePicker popup
    if (
      event.target.closest('.ant-picker-dropdown') // AntD TimePicker popup
    ) {
      return;
    }

    if (
      modalContentRef.current &&
      !modalContentRef.current.contains(event.target)
    ) {
      closeModal();
    }
  };

  const toggleSearch = () => {
    if (!isSearchExpanded) {
      setIsSearchExpanded(true);
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 300);
    } else if (searchQuery.trim() === "") {
      closeSearch();
    }
  };

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (
        (event.key === "s" || event.key === "S") &&
        !event.target.isContentEditable &&
        !["INPUT", "TEXTAREA"].includes(event.target.tagName) &&
        !event.shiftKey
      ) {
        toggleSearch();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [toggleSearch]);

  const closeSearch = () => {
    setIsSearchExpanded(false);
    setSearchQuery("");
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
    setSearchResults([]);
  };

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

  const handleFilterClick = () => {
    setIsFilterMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (
        (event.key === "f" || event.key === "F") &&
        !event.target.isContentEditable &&
        !["INPUT", "TEXTAREA"].includes(event.target.tagName)
      ) {
        handleFilterClick();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleFilterClick]);

  const applyFilter = (filterRange) => {
    setActiveFilter(filterRange);

    if (!filterRange) {
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

  const handleSearchInput = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === "") {
      setSearchResults([]);
      return;
    }

    const filteredTasks = laterTasks.filter(
      (task) =>
        task.title.toLowerCase().includes(query.toLowerCase()) ||
        task.description.toLowerCase().includes(query.toLowerCase())
    );

    setSearchResults(filteredTasks);
  };

  useEffect(() => {
    const handleClick = (event) => {
      if (
        isSearchExpanded &&
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target) &&
        searchQuery.trim() === ""
      ) {
        closeSearch();
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [isSearchExpanded, searchQuery]);

  useEffect(() => {
    localStorage.setItem("archivedTasks", JSON.stringify(archivedTasks));
  }, [archivedTasks]);

  const toggleArchive = () => {
    if (isArchiveOpen) {
      const archiveSection = document.querySelector(".archive-section");
      if (archiveSection) {
        archiveSection.classList.remove("visible");
        archiveSection.classList.add("hidden");

        setTimeout(() => {
          setIsArchiveOpen(false);
        }, 300);
      } else {
        setIsArchiveOpen(false);
      }
    } else {
      setIsArchiveOpen(true);
    }
  };

  const SortableArchiveItem = ({ task }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: task.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition: isDragging
        ? "none"
        : "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
    };

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [isConfirmationClosing, setIsConfirmationClosing] = useState(false);

    const toggleMenu = () => {
      if (isMenuOpen) {
        setIsClosing(true);
        const menuElement = document.querySelector(
          `#archive-task-${task.id} .task-card-menu`
        );
        if (menuElement) {
          menuElement.classList.add("fading-out");

            setIsMenuOpen(false);

        } else {
          setIsMenuOpen(false);
        }
      } else {
        setIsMenuOpen(true);
      }
    };

    const handleContentChange = (e, field) => {
      const updatedValue = e.target.innerText;
      const updatedTasks = archivedTasks.map((t) =>
        t.id === task.id ? { ...t, [field]: updatedValue } : t
      );
      setArchivedTasks(updatedTasks);
      localStorage.setItem("archivedTasks", JSON.stringify(updatedTasks));
    };

    const handleRestoreToLater = (taskId) => {
      const taskToRestore = archivedTasks.find((task) => task.id === taskId);

      if (taskToRestore) {
        setLaterTasks((prevTasks) => [taskToRestore, ...prevTasks]);
        setArchivedTasks((prevTasks) =>
          prevTasks.filter((task) => task.id !== taskId)
        );
        showNotification("Task restored to Later");
        setIsMenuOpen(false);
      }
    };

    const handleMoveToNowFromArchive = (taskId) => {
      let taskToMove = archivedTasks.find((task) => task.id === taskId);

      if (taskToMove) {
        if (nowTask) {
          setLaterTasks((prevTasks) => [nowTask, ...prevTasks]);
        }
        setNowTask(taskToMove);
        setArchivedTasks((prevTasks) =>
          prevTasks.filter((task) => task.id !== taskId)
        );
        showNotification("Task revived!");
        setIsMenuOpen(false);
        window.dispatchEvent(
          new CustomEvent("nowTaskUpdated", {
            detail: taskToMove,
          })
        );
      }
    };

    const showDeleteConfirm = (e) => {
      e.stopPropagation();
      setShowDeleteConfirmation(true);
    };
    const hideDeleteConfirm = () => {
      setIsConfirmationClosing(true);

        setShowDeleteConfirmation(false);
        setIsConfirmationClosing(false);

    };

    const confirmDelete = (taskId) => {
      setArchivedTasks((prevTasks) =>
        prevTasks.filter((task) => task.id !== taskId)
      );
      showNotification("Task deleted");
      setIsMenuOpen(false);
    };

    const maxDescriptionLength = " task's description is long, so long...".length;

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={isDragging ? "is-dragging" : ""}
      >
        <div
          className={`later-tasks-card`}
          key={task.id}
          id={`archive-task-${task.id}`}
          onMouseEnter={() => !isDragging && setIsMenuOpen(true)}
          onMouseLeave={() => setIsMenuOpen(false)}
        >
          <div className="later-tasks-card-top-row">
            <div className="later-tasks-card-emoji-text-container">
              <div className="later-tasks-card-emoji-container">
                <SixDotsIcon
                  className="later-tasks-card-emoji-dots"
                  {...listeners}
                  
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
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        color:
                          task.priority === "High"
                            ? "#801220"
                            : task.priority === "Medium"
                            ? "#675C21"
                            : "#666666",
                        // backgroundColor:
                        //   task.priority === "High"
                        //     ? "#cc4d4d"
                        //     : task.priority === "Medium"
                        //     ? "#675C21"
                        //     : "#a1a1a1",
                      }}
                      className="task-priority-container"
                    >
                      <div
                        style={{
                          backgroundColor:
                            task.priority === "High"
                              ? "#801220"
                              : task.priority === "Medium"
                              ? "#675C21"
                              : "#666666",
                        }}
                        className="task-priority-indecator"
                      />
                      {task.priority}
                    </div>
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

          </div>

          <AnimatePresence>
          {isMenuOpen && (
                          <motion.div
                          className="task-card-menu"
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          variants={menuVariants}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          
                        >
              <button
                className="menu-item"
                onClick={() => handleMoveToNowFromArchive(task.id)}
              >
                <NowIcon className="menu-icon" /> Do Now
              </button>
              <button
                className="menu-item"
                onClick={() => handleRestoreToLater(task.id)}
              >
                <LaterIcon className="menu-icon" /> Later
              </button>
              <div style={{ position: "relative" }}>
                <button
                  className="menu-item delete"
                  onClick={showDeleteConfirm}
                >
                  <BinIcon className="menu-icon" /> Delete
                </button>

                {showDeleteConfirmation && (
                  <motion.div
                  className={`delete-confirmation-popup`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
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
                  </motion.div>
                )}
              </div>
            </motion.div>
            
          )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  // Add new ref for filter menu
  const filterMenuRef = useRef(null);

  // Add useEffect for click outside handling
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(event.target) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target) &&
        !activeFilter // Only close if there's no active filter
      ) {
        setIsFilterMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeFilter]); // Add activeFilter as dependency

  const [descChroma, setDescChroma] = useState(false);
const [durationChroma, setDurationChroma] = useState(false);
const [priorityChroma, setPriorityChroma] = useState(false);
const [aiIconActive, setAiIconActive] = useState(false);
const [animateSort, setAnimateSort] = useState(false);

  const handleAISort = () => {
    const priorityOrder = { High: 0, Medium: 1, Low: 2 };
    setLaterTasks((prev) =>
      [...prev].sort(
        (a, b) =>
          (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3)
      )
    );
    showNotification("Tasks sorted");
    setAiIconActive(true);
    setTimeout(() => setAiIconActive(false), 2000);
  };

  const timePickerInputRef = useRef(null);

  useEffect(() => {
    const input = timePickerInputRef.current;
    if (!input) return;
  
    const handleAnimationEnd = () => {
      setDurationChroma(false);
    };
  
    if (durationChroma) {
      input.addEventListener("animationend", handleAnimationEnd);
    }
  
    return () => {
      input.removeEventListener("animationend", handleAnimationEnd);
    };
  }, [durationChroma]);


  return (
    <motion.div
      className="tasks-page-container"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="notifications-container">
        <AnimatePresence>
          {notifications.slice(-3).map((notification) => (
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
      <div className="right-section">
        <div className="now-tasks-container">
          <div className="now-tasks-text">
            <NowIcon className="now-icon" />
            <p className="now-tasks">Now</p>
          </div>
          {nowTask ? (
            <div className={`now-tasks-card${isTimerActive && nowTask ? " timer-active" : ""}`}>
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
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          color:
                            nowTask.priority === "High"
                              ? "#801220"
                              : nowTask.priority === "Medium"
                              ? "#675C21"
                              : "#666666",
                          // backgroundColor:
                          //   task.priority === "High"
                          //     ? "#cc4d4d"
                          //     : task.priority === "Medium"
                          //     ? "#675C21"
                          //     : "#a1a1a1",
                        }}
                        className="task-priority-container"
                      >
                        <div
                          style={{
                            backgroundColor:
                              nowTask.priority === "High"
                                ? "#801220"
                                : nowTask.priority === "Medium"
                                ? "#675C21"
                                : "#666666",
                          }}
                          className="task-priority-indecator"
                        />
                        {nowTask.priority}
                      </div>
                      <p className="now-tasks-card-title">{nowTask.title}</p>
                    </div>
                    <p className="now-tasks-card-time">{nowTask.time}</p>
                  </div>
                  <p className="now-tasks-card-description">
                    {nowTask.description}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="now-tasks-no-task">
              <LogoIcon className="now-tasks-no-task-logo" />
              <p className="now-tasks-no-task-title">
                I'm bored! Pick something for us to do!
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
                
                <div className="tooltip-wrap">
                  <div className="tooltip-button">S</div>
                  <div className="search-container" ref={searchContainerRef}>
                    <div
                      ref={searchButtonRef}
                      className={`search-button ${isSearchExpanded ? "expanded" : ""}`}
                      onClick={() => {
                        if (!isSearchExpanded) toggleSearch();
                        if (searchInputRef.current) searchInputRef.current.focus();
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <SearchIcon className="search-icon" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        className={`search-input ${isSearchExpanded ? "visible" : ""}`}
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={handleSearchInput}
                        onClick={e => e.stopPropagation()} // Prevent parent div click
                      />
                    </div>
                  </div>
                </div>
                <div className="tooltip-wrap">
                  <div className="tooltip-button">F</div>
                  <div
                    className="filter-container"
                    style={{ position: "relative" }}
                  >
                    <button
                      ref={filterButtonRef}
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
                          exit={{ y: -20, opacity: 0, filter: "blur(8px)" }}
                          transition={{ duration: 0.3 }}
                          className="filter-menu"
                          ref={filterMenuRef} // Add ref here
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
                <div className="tooltip-button">Sort By Priority</div>
                <button className="ai-button" onClick={handleAISort}>
                  <AIIcon className={`ai-icon${aiIconActive ? " ai-icon-active" : ""}`} />
                </button>
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

          {searchQuery.trim() !== "" && searchResults.length > 0 ? (
            <div className="search-results-container">
              {searchResults.map((task) => (
                <SortableItem key={task.id} task={task} />
              ))}
            </div>
          ) : searchQuery.trim() !== "" && searchResults.length === 0 ? (
            <div className="no-results">No tasks found</div>
          ) : activeFilter && filteredResults.length > 0 ? (
            <div className="filtered-results-container">
              {filteredResults.map((task) => (
                <SortableItem key={task.id} task={task} />
              ))}
            </div>
          ) : activeFilter && filteredResults.length === 0 ? (
            <div className="no-results">No tasks match the selected filter</div>
          ) : (
            <DndContext
              sensors={sensors}
              onDragStart={(event) => {
                setIsDragging(true);
                // Force close any open menus
                const openMenus = document.querySelectorAll('.task-card');
                openMenus.forEach(card => {
                  card.style.pointerEvents = 'none';
                  const menu = card.querySelector('.task-card-menu');
                  if (menu) {
                    menu.classList.remove('visible');
                  }
                });
              }}
              onDragEnd={(event) => {
                setIsDragging(false);
                // Re-enable pointer events
                const cards = document.querySelectorAll('.task-card');
                cards.forEach(card => {
                  card.style.pointerEvents = 'auto';
                });
                handleDragEnd(event);
              }}
            >
              <SortableContext
                items={laterTasks.map((task) => task.id)}
                strategy={verticalListSortingStrategy}
              >
                {laterTasks.length > 0 ? (
                  <AnimatePresence>
                    {laterTasks.map((task) =>
                      removingTaskId === task.id ? null : (
                        <motion.div
                          key={task.id}
                          {...(!isDragging ? { layout: true } : {})} // Only apply layout when NOT dragging
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -30 }}
                          transition={isDragging ? { duration: 0 } : { duration: 0.3 }}
                        >
                          <SortableItem task={task} />
                        </motion.div>
                      )
                    )}
                  </AnimatePresence>
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

      <AnimatePresence>
        {showModal && (
          <motion.div
            className={`modal-overlay${isClosing ? " closing" : ""}`}
            initial={{ y: 0, opacity: 0 }}
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
                    <motion.input
                      type="text"
                      placeholder="Enter task title..."
                      className={`modal-input ${
                        formSubmitted && errors.title ? "input-error" : ""
                      }`}
                      maxLength={50}
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
                    <div className="text-area-wrapper">
                    <textarea
                      placeholder={
                        isDescriptionSuggested
                          ? suggestionText
                          : "Enter task description..."
                      }
               className={`modal-input${descChroma ? " chroma-text" : ""}`}
                      rows="2"
                      maxLength={60}
                      value={taskDescription}
                      onChange={handleDescriptionChange}
                      onKeyDown={handleDescriptionKeyDown}
                      ref={descriptionInputRef}
                    ></textarea>
                    </div>
       
                    {formSubmitted && errors.description && (
                      <p className="error-message">{errors.description}</p>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group half">
                      <label>Duration</label>
                      <div className="text-area-wrapper">
                      <TimePicker
  style={{ width: "100%", height: "45px" }}
  className={`time-picker${durationChroma ? " chroma-animate" : ""}`}
  value={duration}
  onChange={setDuration}
  format="HH:mm"
  minuteStep={5}
  showNow={false}
  allowClear={false}
  inputReadOnly
  popupClassName="dark-timepicker"

  ref={node => {
    durationInputRef.current = node;
    // AntD TimePicker input is nested, so get the real input:
    if (node && node.input) timePickerInputRef.current = node.input;
  }
  }
/>
</div>

                      {formSubmitted && errors.duration && (
                        <p className="error-message">{errors.duration}</p>
                      )}
                      

                    </div>

                    <div className="form-group half">
                      <label htmlFor="priority">Priority</label>
                      <div className="text-area-wrapper">
                      <select
                        id="priority"
                        className={`modal-input${priorityChroma ? " chroma-text" : ""}`}
                        value={taskPriority}
                        onChange={(e) => setTaskPriority(e.target.value)}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                    </div>
                  </div>

                  <div className="form-row">
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
                              bottom: "45px",
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
