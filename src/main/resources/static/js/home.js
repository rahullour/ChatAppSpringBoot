$(document).ready(function() {
    let emailList = [];
    // User Invitation Logic
    $('#emailInput').on('keypress', function(e) {
        if (e.which === 13) { // Enter key
            const email = $(this).val();
            if (validateEmail(email)) {
                emailList.push(email);
                $(this).val('');
                updateEmailList();
            } else {
                alert('Invalid email address');
            }
        }
    });

    function validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    function updateEmailList() {
        $('#emailList').empty();
        emailList.forEach((email, index) => {
            $('#emailList').append(`
                <div class="email-item">
                    ${email} <button class="remove-email" data-index="${index}">x</button>
                </div>
            `);
        });
    }

    $(document).on('click', '.remove-email', function() {
        const index = $(this).data('index');
        emailList.splice(index, 1);
        updateEmailList();
    });

    $('#inviteForm').on('submit', function(event) {
        event.preventDefault();
        const selectedOptions = Array.from(document.getElementById('emailInput').selectedOptions);
        const emails = selectedOptions.map(option => option.value.trim());
        document.getElementById('emailList').value = JSON.stringify(emails);
        this.submit();
    });
    document.getElementById('group_type').addEventListener('change', function() {
        const groupNameInput = document.getElementById('group_name');
        const groupImageInput = document.getElementById('profilePictureFile');

        if (this.checked) {
            groupNameInput.disabled = false; // Enable input
            groupImageInput.disabled = false;
            groupImageInput.classList.remove('disabled');
            groupNameInput.classList.remove('disabled'); // Remove disabled class if needed
        } else {
            groupNameInput.disabled = true; // Disable input
            groupNameInput.classList.add('disabled'); // Add disabled class if needed
            groupImageInput.disabled = true; // Disable input
            groupImageInput.classList.add('disabled'); // Add disabled class if needed
        }
    });
    $('#emailInput').select2({
        placeholder: "Enter email addresses",
        tags: true, // Allow users to add new emails
        ajax: {
            url: '/api/users/getUserEmails', // Endpoint to fetch existing emails
            dataType: 'json',
            delay: 250,
            data: function (params) {
                return {
                    q: params.term // Search term
                };
            },
            processResults: function (data) {
                return {
                    results: data.map(email => ({
                        id: email,
                        text: email
                    }))
                };
            },
            cache: true
        },
        minimumInputLength: 1
    });
});

function previewProfileImage(event) {
    var reader = new FileReader();
    reader.onload = function() {
        var output = document.getElementById('previewImageProfile');
        output.src = reader.result;
        document.getElementById('imagePreviewProfile').style.display = 'block';
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

function trimProfileEmail() {
    const profileSettings = document.getElementById('profile-settings');
    const emailInput = profileSettings.querySelector('#email');
    let emailValue = emailInput.value.trim(); // Trim whitespace from the input
    if (emailValue.endsWith('@gmail.com')) {
        emailInput.value = emailValue.slice(0, -10);
    }
}

function loadContent(option, element) {
    // Hide all sections initially
    document.getElementById('profile-settings').style.display = 'none';
    document.getElementById('theme-settings').style.display = 'none';
    document.getElementById('blocked-users-settings').style.display = 'none';
    document.getElementById('account-settings').style.display = 'none';
    const navItems = document.querySelectorAll('#settings-modal .nav-item');
    navItems.forEach(item => {
        item.classList.remove('selected');
    });
    if(element == null){
        navItems[0].classList.add('selected');
        }
    else{
        element.classList.add('selected');
    }
    switch(option) {
        case 'profile-settings':
            document.getElementById('profile-settings').style.display = 'block';
            trimProfileEmail();
            break;
        case 'theme':
            document.getElementById('theme-settings').style.display = 'block';
            break;
        case 'blocked-users':
            document.getElementById('blocked-users-settings').style.display = 'block';
            break;
        case 'account-settings':
            document.getElementById('account-settings').style.display = 'block';
            break;
        default:
            // Optionally handle default case
            break;
    }
}


function deleteAccount() {
    // Implement account deletion functionality
}

// Function to fetch the current user ID
async function fetchCurrentUserId() {
    try {
        const response = await fetch(`/api/users/currentUser/getId`);
        const userId = await response.json();
        return userId; // Assuming userId is returned as an object, extract the ID if necessary
    } catch (error) {
        console.error('Error fetching current user ID:', error);
        return -1; // Return a default value in case of an error
    }
}

// Function to fetch the profile picture URL
async function getProfilePic(senderId) {
    try {
        const response = await fetch(`/api/users/getProfilePic?id=${senderId}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data.profilePicture;
    } catch (error) {
        console.error('Error fetching profile picture:', error);
        return '';
    }
}
    
 function previewSettingsProfileImage(event) {
    var reader = new FileReader();
    reader.onload = function() {
        var output = document.getElementById('previewImageProfile');
        output.src = reader.result;
        document.getElementById('previewImageProfile').style.display = 'block';
    };
    reader.readAsDataURL(event.target.files[0]);
}

// Function to initialize profile picture on modal load
async function initializeProfilePicture() {
    const userId = await fetchCurrentUserId(); // Fetch current user ID
    if (userId !== -1) { // Check if user ID is valid
        const profilePicBase64 = await getProfilePic(userId); // Fetch profile picture
        if (profilePicBase64) {
            const imgElement = document.getElementById("previewImageProfile");
            imgElement.src = `data:image/png;base64,${profilePicBase64}`; // Set image source
            imgElement.style.display = "block"; // Show image
        }
    }
}

// Call this function when the settings modal is shown
$('#settings-modal').on('show.bs.modal', function () {
    initializeProfilePicture(); // Initialize profile picture when modal opens
});

async function fetchThemes() {
    try {
        const response = await fetch('/api/themes'); // Adjust the endpoint as needed
        if (!response.ok) {
            throw new Error('Failed to fetch themes');
        }
        const themes = await response.json();
        displayThemes(themes); // Call your display function here
    } catch (error) {
        console.error('Error fetching themes:', error);
    }
}

async function initialize() {
    try {
        await Promise.all([
            fetchThemes(),
            setCurrentTheme()
        ]);
        console.log('Themes set executed successfully in the background.');
    } catch (error) {
        console.error('Error during initialization:', error);
    }
}

// Call the initialize function when needed
initialize();


function displayThemes(themes) {
    const themeSelection = document.getElementById('theme-selection');
    themeSelection.innerHTML = ''; // Clear existing themes

    themes.forEach(theme => {
        const themeBox = document.createElement('div');
        themeBox.className = 'theme-box col-md-2';

        // Use the compressed URL directly for background image
        if (theme.compressedUrl) {
            themeBox.style.backgroundImage = `url(data:image/png;base64,${theme.compressedUrl})`;
            themeBox.style.backgroundSize = 'cover';
            themeBox.style.height = '100px'; // Set height for the box
            themeBox.style.cursor = 'pointer';
        } else {
            console.warn(`No compressed URL found for theme ID: ${theme.id}`);
        }

        // Add click event listener with ID
        themeBox.onclick = () => selectTheme(theme.id); // Pass the ID instead of a URL

        themeSelection.appendChild(themeBox);
    });
}

async function selectTheme(id) {
    try {
        // Fetch the original image in Base64 format
        const response = await fetch(`/api/themeImage?themeId=${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch theme image');
        }
        const base64Image = await response.text(); // Get the Base64 string
        // Set the background image using the original image
        document.getElementById('messages').style.backgroundImage = `url(data:image/png;base64,${base64Image})`;

        // Now set the theme using its ID
        const setThemeResponse = await fetch(`/api/setTheme?themeId=${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!setThemeResponse.ok) {
            throw new Error('Failed to set theme');
        }

        alert('Theme updated successfully!');
    } catch (error) {
        console.error('Error setting theme:', error);
    }
}

async function setCurrentTheme() {
    try {
        const response = await fetch('/api/currentTheme');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const text = await response.text(); // Get raw text first
        if (!text) {
            console.log('Received empty response');
            return;
        }

        const theme = JSON.parse(text); // Parse the text as JSON
        if (theme != null) {
            const base64Image = `data:image/png;base64,${theme.themeUrl}`;
            document.getElementById('messages').style.backgroundImage = `url('${base64Image}')`;
        }

    } catch (error) {
        console.error('Error fetching themes:', error);
    }
}

