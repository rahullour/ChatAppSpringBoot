$(document).ready(function() {
    let emailList = [];
    let stompClient = null;

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


    function sendMessage() {
        const message = {
            from: 'YourUsername', // Replace with actual username
            text: $('#messageInput').val()
        };
        stompClient.send("/app/sendMessage", {}, JSON.stringify(message));
        $('#messageInput').val('');
    }

    function showMessage(message) {
        const messageContainer = $('#messages');
        const messageElement = $('<div class="message"></div>');

        // Check if the message is sent by the current user
        if (message.from === 'YourUsername') { // Replace 'YourUsername' with the actual username
            messageElement.addClass('sent');
            messageElement.text(message.text);
        } else {
            messageElement.addClass('received');
            messageElement.text(message.from + ': ' + message.text);
        }

        messageContainer.append(messageElement);
        messageContainer.scrollTop(messageContainer[0].scrollHeight); // Scroll to the bottom
    }

    $('#inviteForm').on('submit', function(event) {
        event.preventDefault();
        const selectedOptions = Array.from(document.getElementById('emailInput').selectedOptions);
        const emails = selectedOptions.map(option => option.value.trim());
        document.getElementById('emailList').value = JSON.stringify(emails);
        this.submit();
    });
    document.getElementById('group_type').addEventListener('change', function() {
        const groupNameInput = document.getElementById('group_name');

        if (this.checked) {
            groupNameInput.disabled = false; // Enable input
            groupNameInput.classList.remove('disabled'); // Remove disabled class if needed
        } else {
            groupNameInput.disabled = true; // Disable input
            groupNameInput.classList.add('disabled'); // Add disabled class if needed
        }
    });
    $('#emailInput').select2({
        placeholder: "Enter email addresses",
        tags: true, // Allow users to add new emails
        ajax: {
            url: '/api/getUserEmails', // Endpoint to fetch existing emails
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

document.addEventListener('DOMContentLoaded', function() {
    // Fetch single invites
    fetchInvites('api/invites/single')
        .then(singleInvites => {
            if (singleInvites.length > 0) {
                displayInvites(singleInvites, 'single');
            } else {
                // If no single invites, fetch group invites
                fetchInvites('api/invites/group')
                    .then(groupInvites => {
                        if (groupInvites.length > 0) {
                            displayInvites(groupInvites, 'group');
                        } else {
                            // Show the "Invite Users" button if no invites are found
                            showInviteButton();
                        }
                    })
                    .catch(error => console.error('Error fetching group invites:', error));
            }
        })
        .catch(error => console.error('Error fetching single invites:', error));
});

function fetchInvites(endpoint) {
    return fetch(endpoint)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => data)
        .catch(error => {
            console.error('Error fetching invites:', error);
            throw error;
        });
}

function displayInvites(invites, type) {
    const listId = type === 'single' ? 'single-list' : 'group-list';
    const inviteList = document.getElementById(listId);
    inviteList.innerHTML = ''; // Clear previous invites

    invites.forEach(invite => {
        const inviteItem = document.createElement('li');
        inviteItem.classList.add('invite-item');

        if (type === 'single') {
            inviteItem.textContent = `Invite from: ${invite.senderEmail}`; // Display sender email for single invites
        } else {
            inviteItem.textContent = `Group invite: ${invite.inviteGroup.userGroup.name}`; // Display group name for group invites
        }

        inviteList.appendChild(inviteItem); // Append the invite item to the respective list
    });
}

function showInviteButton() {
    const inviteButton = document.querySelector('.invite-btn');
    inviteButton.style.display = 'block'; // Show the invite button
}
