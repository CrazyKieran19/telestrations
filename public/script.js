const socket = io();
let role = "";
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let drawing = false;
let guessInput = document.getElementById("guessInput");
let submitBtn = document.getElementById("submitBtn");

socket.on("role", (r) => {
  role = r;
  updateUI();
});

socket.on("nextTurn", ({ role: newRole, data }) => {
  role = newRole;
  if (newRole === "draw") {
    guessInput.style.display = "none";
    canvas.style.display = "block";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  } else {
    canvas.style.display = "none";
    guessInput.style.display = "block";
    if (data.startsWith("data:image")) {
      let img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = data;
      canvas.style.display = "block";
    }
  }
});

submitBtn.onclick = () => {
  if (role === "draw") {
    let dataUrl = canvas.toDataURL();
    socket.emit("submitDrawing", dataUrl);
  } else {
    socket.emit("submitGuess", guessInput.value);
    guessInput.value = "";
  }
};

function updateUI() {
  if (role === "draw") {
    canvas.style.display = "block";
    guessInput.style.display = "none";
  } else {
    canvas.style.display = "none";
    guessInput.style.display = "block";
  }
}

// Drawing logic
canvas.addEventListener("mousedown", () => drawing = true);
canvas.addEventListener("mouseup", () => drawing = false);
canvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(e.offsetX, e.offsetY, 4, 0, Math.PI * 2);
  ctx.fill();
});
