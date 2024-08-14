 function previewProfileImage(event) {
    var reader = new FileReader();
    reader.onload = function() {
        var output = document.getElementById('previewImage');
        output.src = reader.result;
        document.getElementById('imagePreview').style.display = 'block';
    };
    reader.readAsDataURL(event.target.files[0]);
}

function validatePasswords() {
    var password = document.getElementById("password").value;
    var confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return false;
    }

    return true;
}