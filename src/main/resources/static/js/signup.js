 function previewProfileImage(event) {
    var reader = new FileReader();
    reader.onload = function() {
        var output = document.getElementById('previewImage');
        output.src = reader.result;
        document.getElementById('imagePreview').style.display = 'block';
    };
    reader.readAsDataURL(event.target.files[0]);
}

//function trimEmail(email) {
//    let emailValue = email.trim();
//    while(emailValue.endsWith('@gmail.com')) {
//        emailValue = emailValue.slice(0, -10);
//    }
//    return emailValue;
//}
//
//function validateForm(event) {
//    const emailInput = document.getElementById('email');
//    // Validate passwords first
//    emailInput.value = trimEmail(emailInput.value);
//    return true; // Allow form submission
//}

//function validatePasswords() {
//    var password = document.getElementById("password").value;
//    var confirmPassword = document.getElementById("confirmPassword").value;
//
//    if (password !== confirmPassword) {
//        alert("Passwords do not match.");
//        return false; // Return false to indicate validation failure
//    }
//
//    return true; // Return true to indicate validation success
//}