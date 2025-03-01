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
//
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
//    if (!validatePasswords()) {
//        emailInput.value = trimEmail(emailInput.value);
//        event.preventDefault();
//        return false; // Prevent form submission if passwords don't match
//    }
//    emailInput.value = trimEmail(emailInput.value) + '@gmail.com';
//    return true; // Allow form submission
//}
//
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

//function trimProfileEmail() {
//    const profileSettings = document.getElementById('profile-settings');
//    const emailInput = profileSettings.querySelector('#email');
//    let emailValue = emailInput.value.trim(); // Trim whitespace from the input
//    if (emailValue.endsWith('@gmail.com')) {
//        emailInput.value = emailValue.slice(0, -10);
//    }
//}

function loadContent(option, element) {
    // Hide all sections initially
    document.getElementById('profile-settings').style.display = 'none';
    document.getElementById('theme-settings').style.display = 'none';
    document.getElementById('login-history-settings').style.display = 'none';
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
            break;
        case 'theme':
            document.getElementById('theme-settings').style.display = 'block';
            break;
        case 'login-history':
            document.getElementById('login-history-settings').style.display = 'block';
             // Fetch login history if "login-history" tab is clicked
            fetch('/api/userdata/login-history')
                .then(response => response.json())
                .then(data => {
                    let tableBody = document.querySelector("#login-history-settings tbody");
                    tableBody.innerHTML = ''; // Clear previous entries

                    data.forEach(entry => {
                        let row = `<tr>
                            <td>${entry.type}</td>
                            <td>${new Date(entry.createdAt).toLocaleString()}</td>
                        </tr>`;
                        tableBody.innerHTML += row;
                    });
                })
                .catch(error => console.error('Error fetching login history:', error));
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
// Global state to track loading status
const state = {
    themesLoaded: false,
    currentThemeLoaded: false,
};

// Event dispatcher for state changes
const eventDispatcher = {
    listeners: {},
    addListener(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    },
    dispatch(event) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback());
        }
    },
};

// Initialize the app
function initialize() {
    showLoadingIndicator();
    Promise.all([fetchThemes(), setCurrentTheme()])
        .then(() => {
            hideLoadingIndicator();
        })
        .catch(error => {
            console.error('Initialization error:', error);
            showErrorMessage('Failed to initialize the app. Please refresh the page.');
            hideLoadingIndicator();
        });
}

// Fetch themes without blocking the UI
function fetchThemes() {
    return $.ajax({
        url: '/api/themes',
        method: 'GET',
        success: function (themes) {
            displayThemes(themes);
            state.themesLoaded = true;
            eventDispatcher.dispatch('themesLoaded');
        },
        error: function () {
            console.error('Error fetching themes');
            showErrorMessage('Failed to load themes. Please try again later.');
        },
    });
}

function displayThemes(themes) {
    const themeSelection = $('#theme-selection');
    themeSelection.empty(); // Clear existing themes

    themes.forEach((theme) => {
        const themeBox = createThemeBox(theme);
        // Use setTimeout to prevent freezing during rendering
        setTimeout(() => {
            themeSelection.append(themeBox);
        }, 0);
    });
}

function createThemeBox(theme) {
    const themeBox = $('<div class="theme-box col-md-2"></div>');
    const loadingIndicator = createLoadingIndicator();

    themeBox.append(loadingIndicator);

    if (theme.compressedUrl) {
        lazyLoadThemeImage(theme.compressedUrl, themeBox, loadingIndicator);
    } else {
        loadingIndicator.text('No image');
        setTimeout(() => { loadingIndicator.hide(); }, 2000); // Hide after some time
    }

    themeBox.on('click', () => selectTheme(theme.id));

    return themeBox;
}

// Lazy load theme image
function lazyLoadThemeImage(url, themeBox, loadingIndicator) {
    const img = new Image();
    loadingIndicator.show();

    img.onload = () => {
        themeBox.css('background-image', `url(data:image/png;base64,${url})`);
        themeBox.css('background-size', 'cover');
        loadingIndicator.hide();
    };

    img.onerror = () => {
        loadingIndicator.text('Error loading image');
        setTimeout(() => { loadingIndicator.hide(); }, 2000);
    };

    // Start loading the image
    setTimeout(() => {
        img.src = `data:image/png;base64,${url}`;
    }, 0);
}

function createLoadingIndicator() {
    return $('<div class="loading-indicator">Loading...</div>');
}

function selectTheme(id) {
    showLoadingIndicator();

    $.ajax({
        url: `/api/themeImage?themeId=${id}`,
        method: 'GET',
        success: function (base64Image) {
            applyThemeBackground(base64Image);
            $.ajax({
                url: `/api/setTheme?themeId=${id}`,
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                success: function () {
                    showSuccessMessage('Theme updated successfully!');
                },
                error: function () {
                    showErrorMessage('Failed to set theme.');
                },
            });
        },
        error: function () {
            showErrorMessage('Failed to fetch theme image.');
        },
        complete: hideLoadingIndicator,
    });
}

function setCurrentTheme() {
    return $.ajax({
        url: '/api/currentTheme',
        method: 'GET',
        success: function (base64Image) {
            applyThemeBackground(base64Image);
            state.currentThemeLoaded = true;
            eventDispatcher.dispatch('currentThemeLoaded');
        },
        error: function () {
            console.error('Error fetching current theme');
            showErrorMessage('Using default.');
        },
    });
}

function applyThemeBackground(base64Image) {
    $('#messages').css('background-image', `url(data:image/png;base64,${base64Image})`);
}

function showLoadingIndicator() {
    $('#loading-overlay').show();
}

function hideLoadingIndicator() {
    $('#loading-overlay').hide();
}

function showErrorMessage(message) {
    alert(message); // Replace with a more user-friendly notification system
}

function showSuccessMessage(message) {
    alert(message); // Replace with a more user-friendly notification system
}

function togglePasswordFields() {
    const passwordField = document.getElementById('password');
    const confirmPasswordField = document.getElementById('confirmPassword');
    const updatePasswordCheckbox = document.getElementById('updatePasswordCheckbox');

    if (updatePasswordCheckbox.checked) {
        passwordField.disabled = false;
        confirmPasswordField.disabled = false;
    } else {
        passwordField.disabled = true;
        confirmPasswordField.disabled = true;
    }
}

// Function to enable/disable email field based on checkbox state
function toggleEmailField() {
    const emailField = document.getElementById('email');
    const updateEmailCheckbox = document.getElementById('updateEmailCheckbox');

    if (updateEmailCheckbox.checked) {
        emailField.disabled = false;
    } else {
        emailField.disabled = true;
    }
}

// Initially disable password and email fields
document.addEventListener('DOMContentLoaded', function() {
    togglePasswordFields();
    toggleEmailField();
});

// Call the initialize function when the DOM is ready
$(document).ready(initialize);
