import clickSound from "../sound/click.mp3";
import popSound from "../sound/pop.mp3";
import endSound from "../sound/end.mp3";
import startSound from "../sound/start.mp3";
import deleteSound from "../sound/delete.mp3";
import PopupSound from "../sound/popup-alert.mp3";

const sounds = {
  taskAdd: new Audio(popSound),
  timerEnd: new Audio(endSound),
  complete: new Audio(startSound),
  deleteTask: new Audio(deleteSound),
  click: new Audio(clickSound),
  popupAlert: new Audio(PopupSound),
};

export const SoundManager = {
  play(name) {
    const isOn = localStorage.getItem("soundEffects") === "on";
    if (!isOn || !sounds[name]) return;
    sounds[name].currentTime = 0;
    sounds[name].play().catch((e) => console.log("Audio error:", e));
  },
};
