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


    // Real-Time Messaging Logic
    function connect() {
        const socket = new SockJS('/chat');
        stompClient = Stomp.over(socket);
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            stompClient.subscribe('/topic/messages', function (message) {
                showMessage(JSON.parse(message.body));
            });
        });
    }

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

    // Initialize WebSocket connection and message sending
    connect();
    $('#sendMessage').click(function() {
        sendMessage();
    });
    $('#messageInput').keypress(function (e) {
        if (e.which === 13) {
            sendMessage();
        }
    });

    // Handle FCM Token Registration
    messaging.requestPermission()
        .then(() => {
            return messaging.getToken();
        })
        .then((token) => {
            // Send the token to your server
            $.ajax({
                url: '/api/users/fcm-token', // Define your API endpoint for saving the FCM token
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ email: 'user@example.com', token: token }), // Replace with actual user email
                beforeSend: function(xhr) {
                    // Set the CSRF token in the request header
                    xhr.setRequestHeader(csrfHeader, csrfToken);
                },
                success: function(response) {
                    console.log('FCM token saved successfully!');
                },
                error: function(error) {
                    console.error('Error saving FCM token:', error);
                }
            });
        })
        .catch((err) => {
            console.error('Unable to get permission to notify.', err);
        });
});
