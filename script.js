document.getElementById("tracker-form")?.addEventListener("submit", function (e) {
  e.preventDefault();

  const startDate = document.getElementById("start-date").value;
  const notes = document.getElementById("notes").value;
  const periodLength = parseInt(document.getElementById("period-length").value) || 5;
  const symptoms = Array.from(document.querySelectorAll('input[name="symptom"]:checked')).map(s => s.value);
  const reminder = document.getElementById("reminder-toggle")?.checked || false;

  let entries = JSON.parse(localStorage.getItem("pinktrackEntries")) || [];

  let cycleLength = 28;
  if (entries.length > 0) {
    const lastStart = new Date(entries[entries.length - 1].startDate);
    const currentStart = new Date(startDate);
    cycleLength = Math.max(21, Math.min(35, Math.ceil((currentStart - lastStart) / (1000 * 60 * 60 * 24))));
  }

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + periodLength - 1);
  const formattedEndDate = endDate.toISOString().split("T")[0];

  const entry = { startDate, endDate: formattedEndDate, notes, cycleLength, periodLength, symptoms, reminder };

  const isDuplicate = entries.some((e) => e.startDate === startDate);
  if (isDuplicate) {
    showPopup("You've already logged this start date.");
    return;
  }

  entries.push(entry);
  localStorage.setItem("pinktrackEntries", JSON.stringify(entries));

  showPopup(`Entry saved! Your period ends on ${formattedEndDate}`);
  document.getElementById("tracker-form").reset();

  updateCountdown();
  displaySavedEntries();
});

function showPopup(message) {
  const popup = document.getElementById("popup");
  const msg = document.getElementById("popup-message");
  if (popup && msg) {
    msg.textContent = message;
    popup.style.display = "block";
  }
}

function closePopup() {
  const popup = document.getElementById("popup");
  if (popup) popup.style.display = "none";
}

function displaySavedEntries() {
  const entries = JSON.parse(localStorage.getItem("pinktrackEntries")) || [];
  const list = document.getElementById("entry-list");
  const calendar = document.getElementById("calendar-container");
  const newEntryLink = document.getElementById("new-entry-link");

  if (!list) return;

  list.innerHTML = "";
  calendar.innerHTML = "";
  calendar.style.display = "none";
  if (newEntryLink) newEntryLink.style.display = entries.length === 0 ? "inline-block" : "none";

  if (entries.length === 0) return;

  entries.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  entries.forEach((entry, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="entry-box">
        📅 <strong>Start:</strong> ${entry.startDate}<br>
        🩸 <strong>End:</strong> ${entry.endDate}<br>
        📝 <strong>Notes:</strong> <span id="note-${index}">${entry.notes}</span><br>
        🩺 <strong>Symptoms:</strong> ${entry.symptoms.join(", ") || "None"}<br>
        <button onclick="editNote(${index})">Edit</button>
        <button onclick="deleteEntry(${index})">Delete</button>
      </div>
    `;
    list.appendChild(li);
  });

  const latest = entries[0];
  const start = new Date(latest.startDate);
  const days = latest.periodLength;
  let html = `<h3>📆 Your Period Days</h3><ul>`;
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    html += `<li>Day ${i + 1}: ${d.toISOString().split("T")[0]}</li>`;
  }
  html += `</ul>`;
  calendar.innerHTML = html;
  calendar.style.display = "block";
}

function editNote(index) {
  const entries = JSON.parse(localStorage.getItem("pinktrackEntries")) || [];
  const currentNote = entries[index].notes;
  const newNote = prompt("Edit your note:", currentNote);
  if (newNote !== null) {
    entries[index].notes = newNote;
    localStorage.setItem("pinktrackEntries", JSON.stringify(entries));
    displaySavedEntries();
    showPopup("Note updated!");
  }
}

function deleteEntry(index) {
  let entries = JSON.parse(localStorage.getItem("pinktrackEntries")) || [];
  entries.splice(index, 1);
  localStorage.setItem("pinktrackEntries", JSON.stringify(entries));
  updateCountdown();
  displaySavedEntries();
}

function updateCountdown() {
  const entries = JSON.parse(localStorage.getItem("pinktrackEntries")) || [];

  const label = document.getElementById("countdown-label");
  const periodLabel = document.getElementById("period-status-label");
  const progressCircle = document.getElementById("progress-circle");
  const periodCircle = document.getElementById("period-circle");

  if (entries.length === 0) {
    if (label) label.textContent = "--";
    if (periodLabel) periodLabel.textContent = "--";
    if (progressCircle) progressCircle.style.strokeDashoffset = 628;
    if (periodCircle) periodCircle.style.strokeDashoffset = 628;
    return;
  }

  const lastEntry = entries[0];

  const startDate = new Date(lastEntry.startDate);
  const cycleLength = lastEntry.cycleLength;
  const periodLength = lastEntry.periodLength;

  const nextPeriod = new Date(startDate);
  nextPeriod.setDate(startDate.getDate() + cycleLength);

  const ovulationDate = new Date(startDate);
  ovulationDate.setDate(startDate.getDate() + Math.floor(cycleLength / 2));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const now = new Date(); // real-time clock
  const msPerDay = 1000 * 60 * 60 * 24;
  const dayProgress = (now - startDate) / msPerDay;
  const fractionalProgress = dayProgress / cycleLength;

  const periodEnd = new Date(startDate);
  periodEnd.setDate(startDate.getDate() + periodLength - 1);
  periodEnd.setHours(0, 0, 0, 0);

  const daysToPeriod = Math.max(0, Math.ceil((nextPeriod - today) / msPerDay));
  const daysToOvulation = Math.max(0, Math.ceil((ovulationDate - today) / msPerDay));

  if (label) {
    if (today >= startDate && today <= periodEnd) {
      label.textContent = `Next period in: ${daysToPeriod} days\nOvulation in: ${daysToOvulation} days`;
    } else if (daysToPeriod === 0) {
      label.textContent = "🩸 Period starts today!";
    } else if (today.toDateString() === ovulationDate.toDateString()) {
      label.textContent = "🌸 Ovulation day!";
    } else {
      label.textContent = `Next period in: ${daysToPeriod} days\nOvulation in: ${daysToOvulation} days`;
    }
  }

  if (progressCircle) {
    const total = 628;
    const progress = Math.min(1, (cycleLength - daysToPeriod) / cycleLength);
    progressCircle.style.strokeDashoffset = total - total * progress;
  }

  if (periodLabel && periodCircle) {
    const total = 628;

    if (today >= startDate && today <= periodEnd) {
      const dayNumber = Math.floor(dayProgress) + 1;
      periodLabel.textContent = `🩸 Day ${dayNumber} of your period\nStart: ${lastEntry.startDate}\nEnd: ${lastEntry.endDate}`;
      periodCircle.style.strokeDashoffset = total - total * fractionalProgress;
    } else if (today > periodEnd) {
      periodLabel.textContent = `🌸 Your last period ended on ${lastEntry.endDate}.\nYou can log a new cycle.`;
      periodCircle.style.strokeDashoffset = total;
    } else {
      const cuteMessages = [
        "🌸 Your body’s blooming!!!",
        "☁️ Floating free!!!",
        "🧁 Treat yourself!!!",
        "🩷 You’re in your follicular era!"
      ];
      const msg = cuteMessages[Math.floor(Math.random() * cuteMessages.length)];
      periodLabel.textContent = `${msg}\nStart: ${lastEntry.startDate}\nEnd: ${lastEntry.endDate}`;
      periodCircle.style.strokeDashoffset = total;
    }
  }
}

function scheduleMidnightRefresh() {
  const now = new Date();
  const millisTillMidnight =
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5) - now;

  setTimeout(() => {
    updateCountdown();
    displaySavedEntries();
    scheduleMidnightRefresh(); 
  }, millisTillMidnight);
}

window.addEventListener("DOMContentLoaded", () => {
  updateCountdown();
  displaySavedEntries();
  scheduleMidnightRefresh(); 
});
