console.log("login.js loaded");

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

function setFieldMessage(fieldId, message) {
  const field = document.getElementById(fieldId);
  const messageBox = document.getElementById(fieldId + "Message");

  if (field) {
    field.classList.toggle("input-active", message !== "");
  }

  if (messageBox) {
    messageBox.textContent = message;
  }
}

function validateLoginForm() {
  const email = $("#email").val().trim();
  const password = $("#password").val().trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordPattern =/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

  setFieldMessage("email", email === "" || emailPattern.test(email) ? "" : "Invalid email format");

   setFieldMessage(
    "password",
    password === "" || passwordPattern.test(password)
      ? ""
      : "Password must contain 8+ chars, uppercase, lowercase, number and special character"
  );

  return (
    emailPattern.test(email) &&
    passwordPattern.test(password));
}

$("#loginForm").submit(async function (event) {
  event.preventDefault();

  if (!validateLoginForm()) {
    showAlert("error", "Invalid Login", "Please fix the highlighted fields.");
    return;
  }

  const email = $("#email").val().trim();
  const password = $("#password").val().trim();

  try {
    const response = await fetch(
      `http://localhost:3000/users?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
    );
    const users = await response.json();

    if (users.length > 0) {
      const user = users[0];
      const loggedInUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
        designation: user.designation,
        role: user.role
      };

      localStorage.setItem("loggedInUser", JSON.stringify(loggedInUser));
      await showAlert("success", "Login Success", "Welcome back to MeetFlow.");
      window.location.href = "dashboard.html";
    } else {
      showAlert("error", "Login Failed", "Invalid Email or Password.");
    }
  } catch (error) {
    showAlert("error", "Server Error", "Unable to login. Please check JSON Server.");
  }
});


