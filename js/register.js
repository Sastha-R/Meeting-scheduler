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

function todayDateString() {
  return new Date().toISOString().split("T")[0];
}

function setFieldMessage(fieldId, message) {
  const field = document.getElementById(fieldId);
  const messageId = fieldId === "confirm_password" ? "confirmPasswordMessage" : fieldId + "Message";
  const messageBox = document.getElementById(messageId);

  if (field) {
    field.classList.toggle("input-active", message !== "");
  }

  if (messageBox) {
    messageBox.textContent = message;
  }
}


function validateRegisterForm() {
  const name = $("#name").val().trim();
  const email = $("#email").val().trim();
  const password = $("#password").val().trim();
  const confirmPassword = $("#confirm_password").val().trim();
  const department = $("#department").val();
  const designation = $("#designation").val();
  const dateOfJoin = $("#doj").val();
  const maxDate = todayDateString();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex =/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

  setFieldMessage("name", name === "" ? "Name cannot be empty" : "");
  setFieldMessage("email", email === "" ? "Email is required" : emailRegex.test(email) ? "" : "Invalid email format");
  setFieldMessage(
  "password",
  password === ""
    ? "Password is required"
    : passwordRegex.test(password)
    ? ""
    : "Password must contain 8+ chars, uppercase, lowercase, number and special character"
);
  setFieldMessage(
    "confirm_password",
    confirmPassword === "" ? "Confirm password is required" : password === confirmPassword ? "" : "Passwords do not match"
  );
  setFieldMessage("department", department === "" ? "Department is required" : "");
  setFieldMessage("designation", designation === "" ? "Designation is required" : "");
  setFieldMessage("doj", dateOfJoin !== "" && dateOfJoin > maxDate ? "Date of joining cannot be in the future" : "");

  return (
    name !== "" &&
    emailRegex.test(email) &&
    password !== "" &&
    passwordRegex.test(password) &&
    password === confirmPassword &&
    department !== "" &&
    designation !== "" &&
    dateOfJoin !== "" &&
    dateOfJoin <= maxDate
  );
}

$("#doj").attr("max", todayDateString());

$("#registerForm").on("submit", async function (event) {
  event.preventDefault();

  if (!validateRegisterForm()) {
    showAlert("error", "Registration Error", "Please fix the highlighted fields.");
    return;
  }

  const user = {
    name: $("#name").val().trim(),
    email: $("#email").val().trim(),
    password: $("#password").val().trim(),
    department: $("#department").val(),
    designation: $("#designation").val(),
    dateOfJoin: $("#doj").val()
  };

  try {
    await fetch("http://localhost:3000/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(user)
    });

    await showAlert("success", "Registration Success", "Your account has been created.");
    $("#registerForm")[0].reset();
    window.location.href = "login.html";
  } catch (error) {
    showAlert("error", "Server Error", "Unable to register. Please check JSON Server.");
  }
});
