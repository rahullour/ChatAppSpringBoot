document.getElementById('forgotPasswordLink').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent the default anchor behavior
    var email = document.getElementById('username').value; // Get the value from the username/email input
    if (email) {
        // Redirect to the verifyResetEmail endpoint with the email parameter
        window.location.href = '/verifyResetEmail?email=' + encodeURIComponent(email);
    } else {
        alert('Please enter your email address.'); // Alert if the email field is empty
    }
});