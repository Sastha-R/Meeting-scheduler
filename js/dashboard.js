const savedUser = localStorage.getItem("loggedInUser");
let loggedInUser = null;
let editingMeetingId = null;
let allMeetings = [];
let selectedStatusFilter = "All";
let showDeletedMeetings = false;
const remindedMeetingIds = JSON.parse(localStorage.getItem("remindedMeetingIds") || "[]");

if (!savedUser) {
  window.location.href = "login.html";
} else {
  loggedInUser = JSON.parse(savedUser);

  document.getElementById("userName").textContent = loggedInUser.name;
  document.getElementById("userDesignation").textContent = loggedInUser.designation;
}

function isManager() {
  return loggedInUser && loggedInUser.designation === "Manager";
}

function todayDateString() {
  return new Date().toISOString().split("T")[0];
}

function dateStringFromDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return year + "-" + month + "-" + day;
}

function currentWeekDateRange() {
  const today = new Date(todayDateString() + "T00:00:00");
  const startDate = new Date(today);
  const endDate = new Date(today);

  startDate.setDate(today.getDate() - today.getDay());
  endDate.setDate(startDate.getDate() + 6);

  return {
    start: dateStringFromDate(startDate),
    end: dateStringFromDate(endDate)
  };
}

function formatMeetingDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  const dateParts = String(dateValue).split("-");

  if (dateParts.length !== 3) {
    return dateValue;
  }

  return dateParts[2] + "/" + dateParts[1] + "/" + dateParts[0];
}

function showAlert(icon, title, text) {
  if (window.Swal) {
    return Swal.fire({
      icon: icon,
      title: title,
      text: text,
      confirmButtonText: "OK"
    });
  }

  alert(text || title);
  return Promise.resolve();
}

function showConfirm(title, text) {
  if (window.Swal) {
    return Swal.fire({
      icon: "warning",
      title: title,
      text: text,
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "Cancel"
    }).then(function (result) {
      return result.isConfirmed;
    });
  }

  return Promise.resolve(confirm(text || title));
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isUserRelatedMeeting(meeting) {
  const participantIds = meeting.participantIds || [];
  const isOrganizer = String(meeting.organizerId) === String(loggedInUser.id);
  const isParticipant = participantIds.map(String).includes(String(loggedInUser.id));

  return isOrganizer || isParticipant;
}

function meetingCountsForCurrentUser(meeting) {
  if (meeting.isDeleted === true || meeting.status === "Completed" || meeting.status === "Cancelled") {
    return false;
  }

  if (isManager()) {
    return String(meeting.organizerId) === String(loggedInUser.id);
  }

  return isUserRelatedMeeting(meeting);
}

function updateDashboardCounts() {
  let todayCount = 0;
  let weekCount = 0;
  let totalCount = 0;
  const today = todayDateString();
  const currentWeek = currentWeekDateRange();

  for (let i = 0; i < allMeetings.length; i++) {
    const meeting = allMeetings[i];

    if (!meetingCountsForCurrentUser(meeting)) {
      continue;
    }

    totalCount++;

    if (meeting.date === today) {
      todayCount++;
    }

    if (meeting.date >= currentWeek.start && meeting.date <= currentWeek.end) {
      weekCount++;
    }
  }

  document.getElementById("todayMeetingCount").textContent = todayCount;
  document.getElementById("weekMeetingCount").textContent = weekCount;
  document.getElementById("totalMeetingCount").textContent = totalCount;
}

function applyRolePermissions() {
  const managerElements = document.querySelectorAll(".manager-only");
  const actionColumns = document.querySelectorAll(".actions-column");
  const displayValue = isManager() ? "" : "none";

  for (let i = 0; i < managerElements.length; i++) {
    managerElements[i].style.display = displayValue;
  }

  for (let i = 0; i < actionColumns.length; i++) {
    actionColumns[i].style.display = displayValue;
  }
}

async function loadParticipants() {
  const response = await fetch("http://localhost:3000/users");
  const users = await response.json();

  const participantsList = document.getElementById("participantsList");
  participantsList.innerHTML = "";

  for (let i = 0; i < users.length; i++) {
    const user = users[i];

    if (String(user.id) !== String(loggedInUser.id)) {
      participantsList.innerHTML += `
        <label class="d-block mb-2">
          <input type="checkbox" name="participants" value="${escapeHtml(user.id)}">
          ${escapeHtml(user.name)} (${escapeHtml(user.department)})
        </label>
      `;
    }
  }
}

function getSelectedParticipantIds() {
  const checkedBoxes = document.querySelectorAll("input[name='participants']:checked");
  const participantIds = [];

  for (let i = 0; i < checkedBoxes.length; i++) {
    participantIds.push(checkedBoxes[i].value);
  }

  return participantIds;
}

document.getElementById("logoutBtn").addEventListener("click", async function () {
  localStorage.removeItem("loggedInUser");
  await showAlert("success", "Logout", "You have been logged out.");
  window.location.href = "login.html";
});

function selectMeetingParticipants(participantIds) {
  const checkboxes = document.querySelectorAll("input[name='participants']");

  for (let i = 0; i < checkboxes.length; i++) {
    const checkbox = checkboxes[i];

    checkbox.checked = false;

    for (let j = 0; j < participantIds.length; j++) {
      if (String(checkbox.value) === String(participantIds[j])) {
        checkbox.checked = true;
      }
    }
  }
}

async function saveMeetingToServer(meeting) {
  const response = await fetch("http://localhost:3000/meetings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(meeting)
  });

  if (!response.ok) {
    throw new Error("Meeting could not be saved");
  }

  return await response.json();
}

async function softDeleteMeeting(meetingId) {
  const response = await fetch("http://localhost:3000/meetings/" + meetingId, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      isDeleted: true
    })
  });

  if (!response.ok) {
    throw new Error("Meeting could not be deleted");
  }

  return await response.json();
}

async function restoreMeeting(meetingId) {
  const response = await fetch("http://localhost:3000/meetings/" + meetingId, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      isDeleted: false
    })
  });

  if (!response.ok) {
    throw new Error("Meeting could not be restored");
  }

  return await response.json();
}

async function handleDeleteMeeting(meetingId) {
  if (!isManager()) {
    showAlert("error", "Access Denied", "Only managers can delete meetings.");
    return;
  }

  const confirmDelete = await showConfirm("Delete Meeting", "Are you sure you want to delete this meeting?");

  if (!confirmDelete) {
    return;
  }

  try {
    await softDeleteMeeting(meetingId);
    await showAlert("success", "Meeting Deleted", "Meeting deleted successfully.");
    loadMeetings();
  } catch (error) {
    showAlert("error", "Delete Failed", "Unable to delete meeting.");
  }
}

async function handleRestoreMeeting(meetingId) {
  if (!isManager()) {
    showAlert("error", "Access Denied", "Only managers can restore meetings.");
    return;
  }

  try {
    await restoreMeeting(meetingId);
    await showAlert("success", "Meeting Restored", "Meeting restored successfully.");
    showDeletedMeetings = false;
    updateStatusButtonStyles();
    loadMeetings();
  } catch (error) {
    showAlert("error", "Restore Failed", "Unable to restore meeting.");
  }
}

function findMeetingById(meetingId) {
  for (let i = 0; i < allMeetings.length; i++) {
    const meeting = allMeetings[i];

    if (String(meeting.id) === String(meetingId)) {
      return meeting;
    }
  }

  return null;
}

function handleEditMeeting(meetingId) {
  if (!isManager()) {
    showAlert("error", "Access Denied", "Only managers can edit meetings.");
    return;
  }

  const meeting = findMeetingById(meetingId);

  if (!meeting) {
    showAlert("error", "Meeting Not Found", "Meeting not found.");
    return;
  }

  editingMeetingId = meeting.id;

  document.getElementById("meetingTitle").value = meeting.title || "";
  document.getElementById("meetingDescription").value = meeting.description || "";
  document.getElementById("meetingDate").value = meeting.date || "";
  document.getElementById("meetingTime").value = meeting.time || "";
  document.getElementById("meetingDuration").value = meeting.duration || "";
  document.getElementById("meetingRoom").value = meeting.room || "";
  document.getElementById("meetingType").value = meeting.type || "";
  selectMeetingParticipants(meeting.participantIds || []);

  document.getElementById("meetingStatusGroup").classList.remove("d-none");
  document.getElementById("meetingStatus").value = meeting.status || "Scheduled";

  document.getElementById("meetingModalTitle").textContent = "Edit Meeting";
  document.getElementById("meetingMessage").textContent = "";

  const meetingModalElement = document.getElementById("meetingModal");
  const meetingModal = new bootstrap.Modal(meetingModalElement);
  meetingModal.show();
}

async function updateMeetingOnServer(meetingId, meeting) {
  const response = await fetch("http://localhost:3000/meetings/" + meetingId, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(meeting)
  });

  if (!response.ok) {
    throw new Error("Meeting could not be updated");
  }

  return await response.json();
}

async function loadMeetings() {
  const response = await fetch("http://localhost:3000/meetings");
  const meetings = await response.json();
  const myMeetings = [];

  allMeetings = meetings;
  updateDashboardCounts();

  for (let i = 0; i < meetings.length; i++) {
    const meeting = meetings[i];

    if (showDeletedMeetings) {
      if (meeting.isDeleted !== true) {
        continue;
      }
    } else if (meeting.isDeleted === true) {
      continue;
    }

    if (!meetingPassesFilters(meeting)) {
      continue;
    }

    if (isUserRelatedMeeting(meeting)) {
      myMeetings.push(meeting);
    }
  }

  myMeetings.sort(function (firstMeeting, secondMeeting) {
    return firstMeeting.date.localeCompare(secondMeeting.date);
  });

  displayMeetings(myMeetings);
  checkMeetingReminders(myMeetings);
}

function getStatusBadgeClass(status) {
  if (status === "Scheduled") {
    return "bg-primary";
  }

  if (status === "Completed") {
    return "bg-success";
  }

  if (status === "Cancelled") {
    return "bg-danger";
  }

  return "bg-secondary";
}

function getTableColspan() {
  return isManager() ? 10 : 9;
}

function displayMeetings(meetings) {
  const tableBody = document.getElementById("meetingsTableBody");
  tableBody.innerHTML = "";
  applyRolePermissions();

  if (meetings.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="${getTableColspan()}" class="text-center text-muted">
        NO MEETINGS FOUND </td></tr>`;
    return;
  }

  for (let i = 0; i < meetings.length; i++) {
    const meeting = meetings[i];
    let actionHtml = "";

    if (isManager()) {
      if (showDeletedMeetings) {
        actionHtml = `
          <td class="actions-column">
            <button class="btn btn-sm btn-outline-brand" type="button" onclick="handleRestoreMeeting('${meeting.id}')">Restore</button>
          </td>`;
      } else {
        actionHtml = `
          <td class="actions-column">
            <button class="btn btn-sm btn-outline-primary" type="button" onclick="handleEditMeeting('${meeting.id}')"><i class="bi bi-pencil-square"></i></button>
            <button class="btn btn-sm btn-outline-danger" type="button" onclick="handleDeleteMeeting('${meeting.id}')"><i class="bi bi-trash"></i></button>
          </td>`;
      }
    }

    tableBody.innerHTML += `
      <tr>
        <td>${escapeHtml(meeting.title)}</td>
        <td>${escapeHtml(meeting.description)}</td>
        <td>${escapeHtml(formatMeetingDate(meeting.date))}</td>
        <td>${escapeHtml(meeting.time)}</td>
        <td>${escapeHtml(meeting.duration)}</td>
        <td>${escapeHtml(meeting.room)}</td>
        <td>${escapeHtml(meeting.type)}</td>
        <td>${escapeHtml(meeting.organizerName)}</td>
        <td><span class="badge ${getStatusBadgeClass(meeting.status)}">${escapeHtml(meeting.status)}</span></td>
        ${actionHtml}
      </tr>`;
  }
}

function openMeetingModal() {
  if (!isManager()) {
    showAlert("error", "Access Denied", "Only managers can create meetings.");
    return;
  }

  editingMeetingId = null;

  document.getElementById("meetingModalTitle").textContent = "Create Meeting";
  document.getElementById("meetingForm").reset();
  document.getElementById("meetingMessage").textContent = "";
  document.getElementById("meetingDateMessage").textContent = "";

  document.getElementById("meetingStatusGroup").classList.add("d-none");
  document.getElementById("meetingStatus").value = "Scheduled";

  const meetingModalElement = document.getElementById("meetingModal");
  const meetingModal = new bootstrap.Modal(meetingModalElement);

  meetingModal.show();
}

document.getElementById("createMeetingBtn").addEventListener("click", function () {
  openMeetingModal();
});

function cancelEditMeeting() {
  editingMeetingId = null;

  document.getElementById("meetingForm").reset();
  document.getElementById("meetingMessage").textContent = "";
  document.getElementById("meetingDateMessage").textContent = "";
  document.getElementById("meetingModalTitle").textContent = "Create Meeting";

  document.getElementById("meetingStatusGroup").classList.add("d-none");
  document.getElementById("meetingStatus").value = "Scheduled";

  const meetingModalElement = document.getElementById("meetingModal");
  const meetingModal = bootstrap.Modal.getInstance(meetingModalElement);

  if (meetingModal) {
    meetingModal.hide();
  }
}

document.getElementById("cancelEditBtn").addEventListener("click", function () {
  cancelEditMeeting();
});

function meetingPassesFilters(meeting) {
  const fromDate = document.getElementById("fromDateFilter").value;
  const toDate = document.getElementById("toDateFilter").value;

  if (fromDate !== "" && meeting.date < fromDate) {
    return false;
  }

  if (toDate !== "" && meeting.date > toDate) {
    return false;
  }

  if (selectedStatusFilter !== "All" && meeting.status !== selectedStatusFilter) {
    return false;
  }

  return true;
}

document.getElementById("fromDateFilter").addEventListener("change", function () {
  loadMeetings();
});

document.getElementById("toDateFilter").addEventListener("change", function () {
  loadMeetings();
});

document.getElementById("clearDateFilterBtn").addEventListener("click", function () {
  document.getElementById("fromDateFilter").value = "";
  document.getElementById("toDateFilter").value = "";
  loadMeetings();
});

document.getElementById("deletedMeetingsBtn").addEventListener("click", function () {
  showDeletedMeetings = true;
  updateStatusButtonStyles();
  loadMeetings();
});

const statusButtons = document.querySelectorAll(".status-filter");

for (let i = 0; i < statusButtons.length; i++) {
  statusButtons[i].addEventListener("click", function () {
    selectedStatusFilter = statusButtons[i].dataset.status;
    showDeletedMeetings = false;
    updateStatusButtonStyles();
    loadMeetings();
  });
}

function updateStatusButtonStyles() {
  const statusButtons = document.querySelectorAll(".status-filter");
  const deletedMeetingsBtn = document.getElementById("deletedMeetingsBtn");

  for (let i = 0; i < statusButtons.length; i++) {
    const button = statusButtons[i];

    button.classList.toggle("active", button.dataset.status === selectedStatusFilter && !showDeletedMeetings);
  }

  deletedMeetingsBtn.classList.toggle("active", showDeletedMeetings);
}

function validateMeetingDate() {
  const meetingDate = document.getElementById("meetingDate").value;
  const meetingDateMessage = document.getElementById("meetingDateMessage");

  if (meetingDate !== "" && meetingDate < todayDateString()) {
    meetingDateMessage.textContent = "Meeting date cannot be in the past";
    return false;
  }

  meetingDateMessage.textContent = "";
  return true;
}

document.getElementById("meetingDate").setAttribute("min", todayDateString());
document.getElementById("meetingDate").addEventListener("input", validateMeetingDate);

function checkMeetingReminders(meetings) {
  const now = new Date();

  for (let i = 0; i < meetings.length; i++) {
    const meeting = meetings[i];

    if (meeting.status === "Completed" || meeting.status === "Cancelled" || !meeting.date || !meeting.time) {
      continue;
    }

    if (remindedMeetingIds.includes(String(meeting.id))) {
      continue;
    }

    const meetingStart = new Date(meeting.date + "T" + meeting.time);
    const minutesUntilStart = (meetingStart - now) / 60000;

    if (minutesUntilStart >= 0 && minutesUntilStart <= 10) {
      remindedMeetingIds.push(String(meeting.id));
      localStorage.setItem("remindedMeetingIds", JSON.stringify(remindedMeetingIds));
      showAlert("info", "Meeting Reminder", `Reminder: ${meeting.title} meeting starts in 10 minutes.`);
    }
  }
}

const meetingForm = document.getElementById("meetingForm");

meetingForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  if (!isManager()) {
    showAlert("error", "Access Denied", "Only managers can save meetings.");
    return;
  }

  if (!validateMeetingDate()) {
    showAlert("error", "Invalid Date", "Meeting date cannot be in the past.");
    return;
  }

  let status = "Scheduled";

  if (editingMeetingId !== null) {
    status = document.getElementById("meetingStatus").value;
  }

  const meeting = {
    title: document.getElementById("meetingTitle").value,
    description: document.getElementById("meetingDescription").value,
    date: document.getElementById("meetingDate").value,
    time: document.getElementById("meetingTime").value,
    duration: document.getElementById("meetingDuration").value,
    room: document.getElementById("meetingRoom").value,
    type: document.getElementById("meetingType").value,
    participantIds: getSelectedParticipantIds(),
    organizerId: loggedInUser.id,
    organizerName: loggedInUser.name,
    status: status,
    isDeleted: false
  };

  try {
    if (editingMeetingId === null) {
      await saveMeetingToServer(meeting);
      await showAlert("success", "Meeting Created", "Meeting created successfully.");
    } else {
      await updateMeetingOnServer(editingMeetingId, meeting);
      await showAlert("success", "Meeting Updated", "Meeting updated successfully.");
      editingMeetingId = null;
    }

    document.getElementById("meetingForm").reset();

    const meetingModalElement = document.getElementById("meetingModal");
    const meetingModal = bootstrap.Modal.getInstance(meetingModalElement);

    if (meetingModal) {
      meetingModal.hide();
    }

    loadMeetings();
  } catch (error) {
    document.getElementById("meetingMessage").textContent = "Something went wrong while saving meeting.";
    showAlert("error", "Save Failed", "Something went wrong while saving meeting.");
  }
});

applyRolePermissions();
loadParticipants();
loadMeetings();
updateStatusButtonStyles();
setInterval(function () {
  loadMeetings();
}, 60000);
