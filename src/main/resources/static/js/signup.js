 function previewProfileImage(event) {
    var reader = new FileReader();
    reader.onload = function() {
        var output = document.getElementById('previewImage');
        output.src = reader.result;
        document.getElementById('imagePreview').style.display = 'block';
    };
    reader.readAsDataURL(event.target.files[0]);
}
function validateForm() {
    // Validate passwords first
    if (!validatePasswords()) {
        return false; // Prevent form submission if passwords don't match
    }

    // If passwords match, trim the email and append '@gmail.com'
    const emailInput = document.getElementById('email');
    emailInput.value = emailInput.value.trim() + '@gmail.com';

    return true; // Allow form submission
}

function validatePasswords() {
    var password = document.getElementById("password").value;
    var confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return false; // Return false to indicate validation failure
    }

    return true; // Return true to indicate validation success
}