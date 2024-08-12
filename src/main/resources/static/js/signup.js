function convertToBase64(event) {
    const file = event.target.files[0]; // Get the selected file
    const reader = new FileReader(); // Create a FileReader instance

    reader.onload = function(e) {
        const base64String = e.target.result; // Get the base64 string
        document.getElementById('profilePictureBase64').value = base64String; // Set the hidden input value
        const imagePreview = document.getElementById('previewImage'); // Get the image preview element
        const imageContainer = document.getElementById('imagePreview'); // Get the image preview container

        imagePreview.src = base64String; // Set the src attribute to the base64 string
        imageContainer.style.display = 'block'; // Show the image preview container
    };

    if (file) {
        reader.readAsDataURL(file); // Read the file as a data URL
    }
}
