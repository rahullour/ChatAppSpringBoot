    let stompClient = null; // Declare stompClient in the appropriate scope
    let notificationCount = 0; // Initialize notification count
    let offlineNotification; // Variable to hold the offline notification

    function connectWebSocket() {
        const socket = new SockJS('/ws'); // Adjust the URL as needed
        stompClient = Stomp.over(socket); // Initialize stompClient
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            subscribeToNotifications(); // Subscribe to notifications after connecting
        }, function(error) {
            console.error('STOMP error:', error); // Handle connection errors
        });
    }

    function subscribeToNotifications() {
        const roomId = localStorage.getItem("roomId");
        console.log('Subscribing to room:', roomId);
        if (roomId) {
            stompClient.subscribe('/topic/notifications/' + roomId, function (notification) {
                console.log('Received notification:', notification);
                handleNotification(notification.body); // Handle the incoming notification
            });
        } else {
            console.warn('No roomId found in localStorage');
        }
    }

    function handleNotification(message) {
        console.log('Handling notification:', message);
        notificationCount++; // Increment the notification count
        showNotificationToast(message); // Show the toast notification
    }

    function showNotificationToast(message, persistent = false) {
        const toastContainer = document.getElementById('toast-container');

        // Create a new notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        if(persistent == true){
            notification.classList.add("error");
        }
        notification.innerText = message;

        // Append the notification to the toast container
        toastContainer.appendChild(notification);

        if (!persistent) {
            // Automatically hide the notification after 1 second if not persistent
            setTimeout(() => {
                notification.classList.add('hide');
                // Remove the notification from the DOM after the fade-out transition
                notification.addEventListener('transitionend', () => {
                    toastContainer.removeChild(notification);
                });
            }, 1000); // Adjust the duration as needed
        } else {
            // If persistent, do not auto-hide and allow for manual removal later
            offlineNotification = notification; // Store reference for later use
        }
    }

    // Function to handle offline state
    function handleOffline() {
        showNotificationToast('You are currently offline. Please check your internet connection.', true);
    }

   // Add a variable to track if the chat is loading
   let isChatLoading = false;
   const loadingChatClass = 'loading-chat-notification'; // CSS class for loading notification

   // Function to show the "Loading Chat" notification
   function showLoadingChatNotification() {
     if (isChatLoading) return; // Prevent multiple notifications
     isChatLoading = true;
     showLoadingNotificationToast('Loading chat ... <span class="loading-indicator"></span>', true, loadingChatClass);
   }

   // Function to hide the "Loading Chat" notification
   function hideLoadingChatNotification() {
     isChatLoading = false;
     hideNotificationToast(loadingChatClass); // Remove the loading chat notification with class
   }

   function showLoadingNotificationToast(messageHTML, persistent, className = '') {
     const notification = document.createElement('div');
     notification.classList.add('notification-toast'); // Base class
     if (className) {
       notification.classList.add(className); // Add the specific class
     }
     notification.innerHTML = messageHTML; // Use innerHTML to render the HTML

     document.body.appendChild(notification);

     // Center the notification within the chat-messages div
     centerNotification(notification);

     if (!persistent) {
       setTimeout(() => {
         document.body.removeChild(notification);
       }, 3000); // Example: Remove after 3 seconds
     }
     return notification;
   }


   function hideNotificationToast(className = '') {
     // Find the specific notification to hide
     const notifications = document.getElementsByClassName(className);

     // Check if any notifications with the class name were found
     if (notifications.length > 0) {
       // Remove the first notification found with the specified class
       document.body.removeChild(notifications[0]);
     } else {
       console.log("No notification found with class:", className);
     }
   }

   function centerNotification(notification) {
     const chatMessages = document.querySelector('.chat-messages');
     const sidebar = document.querySelector('.sidebar'); // Replace '.sidebar' with the actual class of your sidebar

     if (chatMessages && notification) {
       const chatRect = chatMessages.getBoundingClientRect();
       const notificationWidth = notification.offsetWidth;
       const notificationHeight = notification.offsetHeight;

       // Calculate the sidebar width (if it exists)
       const sidebarWidth = sidebar ? sidebar.offsetWidth : 0;

       const top = 70; // Account for scrolling
       const left = chatRect.left + (chatRect.width / 2) - (notificationWidth / 2) + (sidebarWidth / 2) - 50;   // Account for scrolling and sidebar

       notification.style.position = 'absolute'; // Ensure absolute positioning
       notification.style.top = top + 'px';
       notification.style.left = left + 'px';
     }
   }


   // You might want to call centerNotification on window resize as well:
   window.addEventListener('resize', () => {
     const notification = document.querySelector('.' + loadingChatClass);
     if (notification) {
       centerNotification(notification);
     }
   });


    // Function to handle online state
    function handleOnline() {
        if (offlineNotification) {
            offlineNotification.classList.add('hide'); // Hide offline notification
            offlineNotification.addEventListener('transitionend', () => {
                const toastContainer = document.getElementById('toast-container');
                toastContainer.removeChild(offlineNotification); // Remove it from DOM after transition
                offlineNotification = null; // Clear reference
            });
        }

        showNotificationToast('You are back online!'); // Show a brief message about being back online
        location.reload();
    }

    // Event listeners for online and offline events
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Initial check for online status on page load
    if (!navigator.onLine) {
        handleOffline(); // Call if already offline on load
    }

    // Connect to WebSocket when the DOM is fully loaded
    document.addEventListener('DOMContentLoaded', async function() {
        connectWebSocket();
        try {
            // Fetch both single and group invites simultaneously
            const [singleInvites, groupInvites] = await Promise.all([
                fetchInvites('api/invites/single'),
                fetchInvites('api/invites/group')
            ]);

            // Event listeners for tab clicks to select first chat if available
            document.querySelector('#one-to-one-tab').addEventListener('click', async () => {
                await displayInvites(singleInvites, 'single'); // Ensure invites are displayed before selecting
                const singleListItems = document.querySelectorAll('#single-list li');
                if (singleListItems.length > 0) {
                    singleListItems[0].click(); // Select first chat in single invites
                }
            });

            document.querySelector('#group-chats-tab').addEventListener('click', async () => {
                await displayInvites(groupInvites, 'group'); // Ensure invites are displayed before selecting
                const groupListItems = document.querySelectorAll('#group-list li');
                if (groupListItems.length > 0) {
                    groupListItems[0].click(); // Select first chat in group invites
                }
            });

            // Auto-select the appropriate tab based on available invites
            if (singleInvites.length > 0) {
                document.querySelector('#one-to-one-tab').click();
            } else if (groupInvites.length > 0) {
                document.querySelector('#group-chats-tab').click();
            }

            // Handle case when no invites are available
            if (singleInvites.length === 0 && groupInvites.length === 0) {
                const chatMessagesBox = document.querySelector('.chat-messages');
                $('.chat-screen').parent().css('height', '92%');
                if (chatMessagesBox) {
                    chatMessagesBox.innerText = "You don't have any conversation, feel free to invite someone!";
                    chatMessagesBox.style.verticalAlign = 'middle';
                    chatMessagesBox.style.textAlign = 'center';
                    chatMessagesBox.style.margin = 'auto';
                }
            }
        } catch (error) {
            console.log('Error fetching invites:', error);
        }
    });


    function fetchInvites(endpoint) {
        return fetch(endpoint)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .catch(error => {
                console.error('Error fetching invites:', error);
                throw error;
            });
    }

    async function displayInvites(invites, type) {
        const listId = type === 'single' ? 'single-list' : 'group-list';
        const inviteList = document.getElementById(listId);
        inviteList.innerHTML = '';

        if (type === "single") {
            for (const invite of invites) {
                const inviteItem = document.createElement('li');
                inviteItem.classList.add('invite-item');
                inviteItem.style.cursor = 'pointer';

                try {
                    // Fetch user ID
                    const userId = await fetchCurrentUserId();
                    if (userId === -1) { // Check if userId is valid
                        console.error('Invalid user ID, db issue, please contact admin');
                        return;
                    }
                    // Fetch user email
                    const userEmail = await fetchUserEmail(userId);
                    if (userEmail === -1) { // Check if fetchCurrentUserId is valid
                        console.error('Invalid user email, db issue, please contact admin');
                        return;
                    }

                    const emailChosen = userEmail === invite.senderEmail ? invite.recipientEmail : invite.senderEmail;
                    const userIdChosenResponse = await fetch(`api/users/getId?email=${emailChosen}`);
                    const userIdChosen = await userIdChosenResponse.json(); // Assuming this returns the ID

                    // Create a wrapper for the invite item
                    const inviteWrapper = document.createElement('div');
                    inviteWrapper.classList.add('invite-wrapper');

                    if (userId) {
                        const profilePicBase64 = await getProfilePic(userIdChosen);
                        const imgElement = document.createElement("img");
                        imgElement.src = `data:image/png;base64,${profilePicBase64}`;
                        imgElement.classList.add("profile-pic");
                        inviteWrapper.appendChild(imgElement);
                    }

                    const usernameResponse = await fetch(`api/users/getUserNameByEmail?email=${emailChosen}`);
                    if (!usernameResponse.ok) {
                        throw new Error('getUserNameByEmail response was not ok');
                    }
                    const username = await usernameResponse.text();

                    // Create a span for the username
                    const usernameElement = document.createElement("span");
                    usernameElement.textContent = username;
                    usernameElement.classList.add("username");

                    inviteWrapper.appendChild(usernameElement);
                    inviteItem.appendChild(inviteWrapper); // Append the wrapper to the invite item

                    inviteItem.setAttribute('data-room-id', `${invite.roomId}`);
                    inviteItem.onclick = () => openChat(`${invite.roomId}`);
                    inviteList.appendChild(inviteItem);

                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            }
        } else {
            // Handle group invites
            const groupedInvites = {};

            // Group invites by roomId
            for (const invite of invites) {
                if (!groupedInvites[invite.roomId]) {
                    groupedInvites[invite.roomId] = [];
                }
                groupedInvites[invite.roomId].push(invite);
            }

            // Create a single invite item for each unique roomId
            for (const roomId in groupedInvites) {
                const groupInviteItems = groupedInvites[roomId];

                // Assuming we only need one of the invites to get the group info
                const firstInvite = groupInviteItems[0];

                try {
                    const groupResponse = await fetch(`api/invite_groups?inviteId=${firstInvite.id}`);
                    if (!groupResponse.ok) {
                        throw new Error('Network response was not ok');
                    }

                    const inviteGroup = await groupResponse.json();

                    // Fetch user group information
                    const userGroupResponse = await fetch(`api/user_groups?groupId=${inviteGroup.userGroup.id}`);
                    if (!userGroupResponse.ok) {
                        throw new Error('Network response was not ok');
                    }
                    const userGroup = await userGroupResponse.json();

                    // Create a single invite item for the group
                    const inviteItem = document.createElement('li');
                    inviteItem.classList.add('invite-item');
                    inviteItem.style.cursor = 'pointer';

                    // Create a wrapper for the invite item
                    const inviteWrapper = document.createElement('div');
                    inviteWrapper.classList.add('invite-wrapper');

                    const profilePicBase64 = await getProfilePicByRoomId(`${userGroup.roomId}`);
                    const imgElement = document.createElement("img");
                    imgElement.src = `data:image/png;base64,${profilePicBase64}`;
                    imgElement.classList.add("profile-pic");
                    inviteWrapper.appendChild(imgElement);

                    // Create a span for the username
                    const usernameElement = document.createElement("span");
                    usernameElement.textContent = `${userGroup.name}`;
                    usernameElement.classList.add("username");

                    inviteWrapper.appendChild(usernameElement);
                    inviteItem.appendChild(inviteWrapper); // Append the wrapper to the invite item

                    inviteItem.setAttribute('data-room-id', `${roomId}`);
                    inviteItem.onclick = () => openChat(`${roomId}`);
                    // Append the group invite item to the list
                    inviteList.appendChild(inviteItem);

                } catch (error) {
                    console.error('Error fetching group data:', error);
                }
            }
        }
    }

    let displayMessagesTimeout = null;

    async function handleNewMessages(snapshot, roomId) {
     return new Promise(async (resolve, reject) => {
            const messagesContainer = document.getElementById("messages");
            if (!messagesContainer) return;

            const currentUserId = await fetchCurrentUserId();

            // Fetch the latest read receipts from the Rooms table
            const roomRef = doc(db, "Rooms", roomId);
            const roomDoc = await getDoc(roomRef);
            const lastReadMessageIdData = roomDoc.exists() ? roomDoc.data().lastReadMessageId || {} : {};

            // Get the last message ID from the DOM
            const lastMessageWrapper = messagesContainer.querySelector(".message-wrapper:last-of-type");
            let lastMessageTimestamp = null;

            if (lastMessageWrapper) {
                const lastMessageId = lastMessageWrapper.getAttribute("data-message-id");
            // Fetch the last message timestamp from firebase using lastMessageId
                const messageRef = doc(db, "Messages", lastMessageId);
                const messageDoc = await getDoc(messageRef);
                if(messageDoc.exists()){
                    lastMessageTimestamp = messageDoc.data().timestamp;
                }
            }
            if(sessionStorage.getItem("newChat") == "true"){
                 showLoadingChatNotification();
                 // Clear any pending calls to displayMessages
                        if (displayMessagesTimeout) {
                            clearTimeout(displayMessagesTimeout);
                        }

                        // Set a new timeout
                        displayMessagesTimeout = setTimeout(async () => {
                            console.log("displaying messages");
                            // Check if chat is open for the roomId
                            if (localStorage.getItem("roomId") != roomId) {
                                console.log("Chat is open for a different room, setting new message count");
                                showNotificationToast('You have new messages in other chats');
                                return;
                            }
                            try {
                                // Get a reference to the Messages collection and order by timestamp in ascending order
                                const messagesQuery = query(
                                    collection(db, "Messages"),
                                    where("roomId", "==", roomId),
                                    orderBy("timestamp", "asc")
                                );

                                const querySnapshot = await getDocs(messagesQuery);
                                const messages = [];

                                querySnapshot.forEach((doc) => {
                                    const data = doc.data();
                                    messages.push(data);
                                });

                                const currentUserId = await fetchCurrentUserId();
                                const now = new Date();
                                let lastDisplayedDate = null;
                                const messagesContainer = document.getElementById("messages");
                                messagesContainer.innerHTML = "";

                                for (const data of messages) {
                                    const messageElement = document.createElement("div");
                                    const isCurrentUser = data.senderId === currentUserId;

                                    const messageWrapper = document.createElement("div");
                                    messageWrapper.classList.add("message-wrapper", isCurrentUser ? "current-user" : "other-user");
                                    messageWrapper.setAttribute("data-message-id", data.messageId); // Store message ID

                                    // Create a hidden div to store messageId and senderId
                                    const hiddenDataDiv = document.createElement("div");
                                    hiddenDataDiv.classList.add("message-metadata");
                                    hiddenDataDiv.style.display = "none"; // Hide the div

                                    hiddenDataDiv.dataset.messageId = data.messageId;
                                    hiddenDataDiv.dataset.senderId = data.senderId;
                                    messageElement.dataset.timestamp = new Date().getTime();

                                    hiddenDataDiv.textContent = `messageId: ${data.messageId}, senderId: ${data.senderId}`;
                                    messageWrapper.appendChild(hiddenDataDiv);

                                    const messageContent = document.createElement("div");
                                    messageContent.classList.add("message-content");

                                    // Add message actions button
                                    const actionsButton = document.createElement("div");
                                    actionsButton.classList.add("message-actions-btn");
                                    actionsButton.innerHTML = `
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <circle cx="12" cy="12" r="1"></circle>
                                            <circle cx="12" cy="5" r="1"></circle>
                                            <circle cx="12" cy="19" r="1"></circle>
                                        </svg>
                                    `;

                                    // Add message actions menu
                                    const actionsMenu = document.createElement("div");
                                    actionsMenu.classList.add("message-actions-menu");
                                    actionsMenu.innerHTML = `
                                        <div class="action-item" data-action="copy">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                            </svg>
                                            Copy
                                        </div>
                                    `;

                                    const messageDate = new Date(data.timestamp.toDate());
                                    const options = { hour: 'numeric', minute: 'numeric', hour12: true };

                                    const displayDateHeader = !lastDisplayedDate ||
                                        messageDate.toDateString() !== lastDisplayedDate.toDateString();

                                    if (displayDateHeader) {
                                        lastDisplayedDate = messageDate;
                                        const dateHeader = document.createElement("h4");
                                        dateHeader.classList.add("date-header");
                                        const month = messageDate.toLocaleString('default', { month: 'long' });
                                        dateHeader.textContent = `${messageDate.getDate()} ${month} ${messageDate.toLocaleTimeString(undefined, options)}`;
                                        messagesContainer.appendChild(dateHeader);
                                    }

                                    let dateDisplay = messageDate.toLocaleTimeString(undefined, options);

                                    const dateElement = document.createElement("div");
                                    dateElement.classList.add("message-date");
                                    dateElement.textContent = dateDisplay;
                                    messageContent.appendChild(dateElement);

                                    const textElement = document.createElement("span");
                                    textElement.textContent = data.text;
                                    messageContent.appendChild(textElement);

                                    if (!isCurrentUser) {
                                        const profilePicBase64 = await getProfilePic(data.senderId);
                                        const imgElement = document.createElement("img");
                                        imgElement.src = `data:image/png;base64,${profilePicBase64}`;
                                        imgElement.classList.add("profile-pic");
                                        messageWrapper.appendChild(imgElement);
                                    }

                                    messageContent.appendChild(actionsButton);
                                    messageContent.appendChild(actionsMenu);
                                    messageWrapper.appendChild(messageContent);
                                    messagesContainer.appendChild(messageWrapper);


                                }
                            } catch (e) {
                                console.error("Error fetching messages: ", e);
                            }
                             // show ready by (run this on handleNewMessages finishes )
                            if (!messagesContainer) return;
                            const roomRef = doc(db, "Rooms", roomId);
                            try {
                                const roomDoc = await getDoc(roomRef);
                                if (roomDoc.exists()) {
                                    const currentUserId = await fetchCurrentUserId();
                                    await showReadyByImages(roomDoc, currentUserId);
                                } else {
                                    console.log("Room does not exists.")
                                }
                            } catch (error) {
                                console.error("Error fetching room:", error);
                            }
                            markMessagesAsRead(localStorage.getItem("roomId"));
                            resolve();
                            sessionStorage.setItem("newChat", "false");
                        }, 300);
            }
            else {
                let lastDisplayedDate = null;
                let lastMessageTimestamp = null;

                // Get the last message ID from the DOM
                const messagesContainer = document.getElementById("messages");
                const lastMessageWrapper = messagesContainer.querySelector(".message-wrapper:last-of-type");

                if (lastMessageWrapper) {
                    const lastMessageId = lastMessageWrapper.getAttribute("data-message-id");
                    // Fetch the last message timestamp from firebase using lastMessageId
                    if (lastMessageId) {
                        const messageRef = doc(db, "Messages", lastMessageId);
                        const messageDoc = await getDoc(messageRef);
                        if (messageDoc.exists()) {
                            lastMessageTimestamp = messageDoc.data().timestamp;
                        }
                    }
                }

                // Construct the Firestore query
                let messagesQuery = query(
                    collection(db, "Messages"),
                    where("roomId", "==", localStorage.getItem("roomId")),
                    orderBy("timestamp", "asc")
                );

                // Add the timestamp filter if a last message ID exists
                if (lastMessageTimestamp) {
                    messagesQuery = query(messagesQuery, where("timestamp", ">", lastMessageTimestamp));
                }

                const newSnapshot = await getDocs(messagesQuery);

                for (const change of newSnapshot.docs) {
                    const data = change.data();
                    const messageId = data.messageId;
                    const isCurrentUser = data.senderId === currentUserId;

                    // Create new message element
                    const messageWrapper = document.createElement("div");
                    messageWrapper.classList.add("message-wrapper", isCurrentUser ? "current-user" : "other-user");
                    messageWrapper.setAttribute("data-message-id", messageId);

                    const messageContent = document.createElement("div");
                    messageContent.classList.add("message-content");

                    const textElement = document.createElement("span");
                    textElement.textContent = data.text;
                    messageContent.appendChild(textElement);

                    // Add message actions button
                    const actionsButton = document.createElement("div");
                    actionsButton.classList.add("message-actions-btn");
                    actionsButton.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="12" cy="5" r="1"></circle>
                            <circle cx="12" cy="19" r="1"></circle>
                        </svg>
                    `;

                    // Add message actions menu
                    const actionsMenu = document.createElement("div");
                    actionsMenu.classList.add("message-actions-menu");
                    actionsMenu.innerHTML = `
                        <div class="action-item" data-action="copy">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                            Copy
                        </div>
                    `;

                    // before adding dateElement check if a date element already exists, if then don't create
                    const messageDate = new Date(data.timestamp.toDate());
                    const options = { hour: 'numeric', minute: 'numeric', hour12: true };

                    // Find the last date header from the messages container
                    const lastDateHeader = messagesContainer.querySelector('.date-header:last-of-type');

                    if (lastDateHeader) {
                        // Extract the date from the last date header's text content
                        try {
                            const lastDateHeaderText = lastDateHeader.textContent;
                            // Parse the date from the string (e.g., "10 February 1:30 PM")
                            lastDisplayedDate = parseDateFromHeader(lastDateHeaderText); // Function to parse the date string
                        } catch (error) {
                            console.error("Error parsing date from header:", error);
                            // Handle the error appropriately, e.g., set lastDisplayedDate to null or a default value
                            lastDisplayedDate = null; // Or some default value, depending on your logic
                        }
                    }

                    // Use toLocalDateString to compare only date and not consider timezone
                    const displayDateHeader = !lastDisplayedDate ||
                        messageDate.toLocaleDateString() !== lastDisplayedDate.toLocaleDateString();

                    if (displayDateHeader) {
                        lastDisplayedDate = messageDate;
                        const dateHeader = document.createElement("h4");
                        dateHeader.classList.add("date-header");
                        const month = messageDate.toLocaleString('default', { month: 'long' });
                        dateHeader.textContent = `${messageDate.getDate()} ${month} ${messageDate.toLocaleTimeString(undefined, options)}`;
                        messagesContainer.appendChild(dateHeader);
                    }

                    let dateDisplay = messageDate.toLocaleTimeString(undefined, options);
                    const dateElement = document.createElement("div");
                    dateElement.classList.add("message-date");
                    dateElement.textContent = dateDisplay;
                    messageContent.appendChild(dateElement);

                    function parseDateFromHeader(dateString) {
                        try {
                            const parts = dateString.split(' ');
                            const day = parseInt(parts[0], 10);
                            const monthString = parts[1];
                            const time = parts[2] + ' ' + parts[3];

                            const monthMap = {
                                'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
                                'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
                            };

                            const month = monthMap[monthString];

                            const dateStr = `${monthString} ${day}, ${new Date().getFullYear()} ${time}`;
                            const parsedDate = new Date(dateStr);

                            if (isNaN(parsedDate.getTime())) {
                                console.error('Invalid date parsed');
                                return null;
                            }

                            return parsedDate;
                        } catch (error) {
                            console.error('Error parsing date:', error);
                            return null;
                        }
                    }
                    if (!isCurrentUser) {
                        const profilePicBase64 = await getProfilePic(data.senderId);
                        if (profilePicBase64) {
                            const imgElement = document.createElement("img");
                            imgElement.src = `data:image/png;base64,${profilePicBase64}`;
                            imgElement.classList.add("profile-pic");
                            messageWrapper.appendChild(imgElement);
                        }
                    }

                    messageContent.appendChild(actionsButton);
                    messageContent.appendChild(actionsMenu);
                    messageWrapper.appendChild(messageContent);
                    messagesContainer.appendChild(messageWrapper);
                }
                resolve();
            }

       });
    }

    let currentMessagesSubscription = null;
    async function openChat(roomId) {
        console.log(`Opening chat for room ID: ${roomId}`);
        sessionStorage.setItem("newChat", "true");
         // Set up Firestore listener for real-time updates after processing invites
        localStorage.setItem("roomId", roomId);
        const messagesQuery = query(
            collection(db, "Messages"),
            where("roomId", "==", localStorage.getItem("roomId")),
            orderBy("timestamp", "asc")
        );
        const messagesContainer = document.getElementById("messages");
        const observer = new MutationObserver(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
        observer.observe(messagesContainer, { childList: true, subtree: true }); // Watch for added children
        onSnapshot(messagesQuery, async (snapshot) => {
            try {
                await handleNewMessages(snapshot, roomId);
                markMessagesAsRead(localStorage.getItem("roomId"));
            } finally {
                // **Display read receipts from Rooms table**
                hideLoadingChatNotification(); // Hide loading notification after completion (success or failure)
            }
        });


        displayReadByUsersFromRooms(roomId);

        if (stompClient && stompClient.connected) {
            console.log('Resubscribing to new room');
            stompClient.unsubscribe('/topic/notifications/' + localStorage.getItem("roomId"));
            subscribeToNotifications();
        } else {
            console.warn('STOMP client not connected');
        }
        notificationCount = 0; // Reset notification count when opening a new chat
    }


    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
    // import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-analytics.js";
      import { writeBatch, getFirestore, collection, getDocs, getDoc, doc, addDoc, query, orderBy, where, limit, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
    // TODO: Add SDKs for Firebase products that you want to use
    // https://firebase.google.com/docs/web/setup#available-libraries

    // Your web app's Firebase configuration
    // For Firebase JS SDK v7.20.0 and later, measurementId is optional
    const firebaseConfig = {
      apiKey: "AIzaSyBGhQf-pYZx3ed6FASGo55RkrcVYS_SrIk",
      authDomain: "wechat-5e447.firebaseapp.com",
      projectId: "wechat-5e447",
      storageBucket: "wechat-5e447.appspot.com",
      messagingSenderId: "97550275374",
      appId: "1:97550275374:web:bae6cd2ecd5f77bad160bf",
      measurementId: "G-WCTTEX1QHQ"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    // const analytics = getAnalytics(app);
    const db = getFirestore(app);

    // Function to send a messagef
   async function sendMessage(roomId) {
       const messageInput = document.getElementById("messageInput");
       const messageText = messageInput.value;
       if (!messageText) return; // Prevent empty messages
       messageInput.value = ""; // Clear the input field

       const messagesContainer = document.getElementById("messages"); // Get messages container

       try {
           const senderId = await fetch(`/api/users/currentUser/getId`)
               .then(response => response.json())
               .catch(error => {
                   console.error('Error fetching current user', error);
                   return -1;
               });

           if (senderId === -1) {
               console.error("Could not get user ID");
               return;
           }

           // 1. Create the message data (including a Firestore-generated ID):
           const messageRef = doc(collection(db, "Messages")); // Get a reference with a new ID
           const messageData = {
               roomId: roomId,
               senderId: senderId,
               text: messageText,
               timestamp: new Date(),
               messageId: messageRef.id // Use the ID from the reference
           };

           //2. Optimistically add the message to the UI

           // Create new message element (same as in your handleNewMessages function)
           const messageElement = document.createElement("div");
           const isCurrentUser = true; // It's the current user sending

           const messageWrapper = document.createElement("div");
           messageWrapper.classList.add("message-wrapper", isCurrentUser ? "current-user" : "other-user");
           messageWrapper.setAttribute("data-message-id", messageData.messageId); // Store message ID

           // Create a hidden div to store messageId and senderId
           const hiddenDataDiv = document.createElement("div");
           hiddenDataDiv.classList.add("message-metadata");
           hiddenDataDiv.style.display = "none"; // Hide the div

           hiddenDataDiv.dataset.messageId = messageData.messageId;
           hiddenDataDiv.dataset.senderId = messageData.senderId;
           messageElement.dataset.timestamp = new Date().getTime();

           hiddenDataDiv.textContent = `messageId: ${messageData.messageId}, senderId: ${messageData.senderId}`;
           messageWrapper.appendChild(hiddenDataDiv);

           const messageContent = document.createElement("div");
           messageContent.classList.add("message-content");

           // Add message actions button
           const actionsButton = document.createElement("div");
           actionsButton.classList.add("message-actions-btn");
           actionsButton.innerHTML = `
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                   <circle cx="12" cy="12" r="1"></circle>
                   <circle cx="12" cy="5" r="1"></circle>
                   <circle cx="12" cy="19" r="1"></circle>
               </svg>
           `;

           // Add message actions menu
           const actionsMenu = document.createElement("div");
           actionsMenu.classList.add("message-actions-menu");
           actionsMenu.innerHTML = `
               <div class="action-item" data-action="copy">
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                       <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                       <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                   </svg>
                   Copy
               </div>
           `;
           let lastDisplayedDate = null;

           // before adding dateElement check if a date element already exists, if then don't create
           const messageDate = new Date(messageData.timestamp);
           const options = { hour: 'numeric', minute: 'numeric', hour12: true };

           // Find the last date header from the messages container
           const lastDateHeader = messagesContainer.querySelector('.date-header:last-of-type');

            function parseDateFromHeader(dateString) {
                try {
                    const parts = dateString.split(' ');
                    const day = parseInt(parts[0], 10);
                    const monthString = parts[1];
                    const time = parts[2] + ' ' + parts[3];

                    const monthMap = {
                        'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
                        'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
                    };

                    const month = monthMap[monthString];

                    const dateStr = `${monthString} ${day}, ${new Date().getFullYear()} ${time}`;
                    const parsedDate = new Date(dateStr);

                    if (isNaN(parsedDate.getTime())) {
                        console.error('Invalid date parsed');
                        return null;
                    }

                    return parsedDate;
                } catch (error) {
                    console.error('Error parsing date:', error);
                    return null;
                }
            }
           if (lastDateHeader) {
               // Extract the date from the last date header's text content
               try {
                   const lastDateHeaderText = lastDateHeader.textContent;
                   // Parse the date from the string (e.g., "10 February 1:30 PM")
                   lastDisplayedDate = parseDateFromHeader(lastDateHeaderText); // Function to parse the date string
               } catch (error) {
                   console.error("Error parsing date from header:", error);
                   // Handle the error appropriately, e.g., set lastDisplayedDate to null or a default value
                   lastDisplayedDate = null; // Or some default value, depending on your logic
               }
           }

           // Use toLocalDateString to compare only date and not consider timezone
           const displayDateHeader = !lastDisplayedDate ||
               messageDate.toLocaleDateString() !== lastDisplayedDate.toLocaleDateString();

           if (displayDateHeader) {
               lastDisplayedDate = messageDate;
               const dateHeader = document.createElement("h4");
               dateHeader.classList.add("date-header");
               const month = messageDate.toLocaleString('default', { month: 'long' });
               dateHeader.textContent = `${messageDate.getDate()} ${month} ${messageDate.toLocaleTimeString(undefined, options)}`;
               messagesContainer.appendChild(dateHeader);
           }

           let dateDisplay = messageDate.toLocaleTimeString(undefined, options);

           const dateElement = document.createElement("div");
           dateElement.classList.add("message-date");
           dateElement.textContent = dateDisplay;
           messageContent.appendChild(dateElement);

           const textElement = document.createElement("span");
           textElement.textContent = messageData.text;
           messageContent.appendChild(textElement);

           messageContent.appendChild(actionsButton);
           messageContent.appendChild(actionsMenu);
           messageWrapper.appendChild(messageContent);
           messagesContainer.appendChild(messageWrapper);

           //3. Scroll to the bottom
           messagesContainer.scrollTop = messagesContainer.scrollHeight;
           //4. Update Firebase
           const batch = writeBatch(db);
           batch.set(messageRef, messageData); // Use the messageRef and data

           markMessagesAsRead(localStorage.getItem("roomId"));
           await batch.commit();
           console.log("Document written");
       } catch (e) {
           console.error("Error adding document: ", e);
       }
   }

   async function showReadyByImages(roomSnapshot, currentUserId){
//        if (!roomSnapshot.exists()) return;
        const messagesContainer = document.getElementById("messages");
        if (!messagesContainer) return;
        const roomData = roomSnapshot.data();
        const lastReadMessageIdData = roomData.lastReadMessageId || {};

        messagesContainer.querySelectorAll(".read-by-wrapper").forEach(el => el.remove());
        for (const [userId, lastReadMessageId] of Object.entries(lastReadMessageIdData)) {
            if (!lastReadMessageId) continue;
            // *** THE CHECK IS HERE ***
            if (userId === currentUserId.toString()) continue; // Skip if the user is the current user

            const messageElement = document.querySelector(`[data-message-id="${lastReadMessageId}"]`);
            if (!messageElement) continue;

            let readByWrapper = messageElement.nextElementSibling;
            if (!readByWrapper || !readByWrapper.classList.contains("read-by-wrapper")) {
                readByWrapper = document.createElement("div");
                readByWrapper.classList.add("read-by-wrapper", "justify-content-end");
                messageElement.insertAdjacentElement("afterend", readByWrapper);
            }

            readByWrapper.innerHTML = "";
            getProfilePic(userId).then(userProfilePic => {
                // Fetch the username using the API
                fetch(`/api/users/getUsername?id=${userId}`)
                    .then(response => response.text()) // Assuming the API returns plain text username
                    .then(username => {
                        if (userProfilePic) {
                            const imgElement = document.createElement("img");
                            const imgElementParent = document.createElement("div");
                            imgElementParent.classList.add("read-by-images");
                            imgElement.src = `data:image/png;base64,${userProfilePic}`;
                            imgElement.classList.add("read-by-avatar");
                            imgElement.style.width = "18px";
                            imgElement.style.height = "18px";
                            imgElement.style.borderRadius = "50%";
                            imgElement.title = `Read by ${username}`;
                            imgElementParent.appendChild(imgElement);
                            readByWrapper.appendChild(imgElementParent);
                        }
                    })
                    .catch(error => {
                        console.error("Error fetching username for user", userId, error);
                        // Optionally, you can still display the userId if fetching the username fails
                        if (userProfilePic) {
                            const imgElement = document.createElement("img");
                            imgElement.src = `data:image/png;base64,${userProfilePic}`;
                            imgElement.classList.add("read-by-avatar");
                            imgElement.style.width = "18px";
                            imgElement.style.height = "18px";
                            imgElement.style.borderRadius = "50%";
                            imgElement.title = `Read by User ${userId} (Username unavailable)`;
                            images.appendChild(imgElement);
                            readByWrapper.appendChild(images);
                        }
                    });
            }).catch(error => {
                console.error("Error fetching profile picture for user", userId, error);
            });
        }
   }

    async function displayReadByUsersFromRooms(roomId) {
        const roomRef = doc(db, "Rooms", roomId);
        const currentUserId = await fetchCurrentUserId();

        onSnapshot(roomRef, (roomSnapshot) => {
            showReadyByImages(roomSnapshot, currentUserId );
        });
    }

    async function markMessagesAsRead(roomId) {
        const currentUserId = await fetchCurrentUserId();
        if (!currentUserId || currentUserId === -1) return;

        const messagesContainer = document.getElementById("messages");
        if (!messagesContainer) return;

        const lastMessageElement = messagesContainer.querySelector(".message-wrapper:last-of-type");
        if (!lastMessageElement) return;

        const messageId = lastMessageElement.dataset.messageId;
        if (!messageId) return;

        const roomRef = doc(db, "Rooms", roomId);
        try {

            const roomDoc = await getDoc(roomRef);
            if (!roomDoc.exists()) return;

            const roomData = roomDoc.data();
            let lastReadMessageId = roomData.lastReadMessageId || {};

            if (lastReadMessageId[currentUserId] !== messageId) {
                lastReadMessageId[currentUserId] = messageId;
                await updateDoc(roomRef, { lastReadMessageId });
                console.log(`Room ${roomId} updated: User ${currentUserId} read message ${messageId}`);
            }
        } catch (error) {
            console.error("Error updating lastReadMessageId:", error);
        }
    }



    // Add jQuery event handlers
    $(document).ready(function() {
        // Handle showing/hiding the menu
        $(document).on('click', '.message-actions-btn', function(e) {
            e.stopPropagation();
            const menu = $(this).siblings('.message-actions-menu');
            $('.message-actions-menu').not(menu).hide();
            menu.toggle();
        });

        // Handle clicking outside to close menu
        $(document).on('click', function(e) {
            if (!$(e.target).closest('.message-actions-menu, .message-actions-btn').length) {
                $('.message-actions-menu').hide();
            }
        });

        // Handle action clicks
        $(document).on('click', '.action-item', function(e) {
            e.stopPropagation();
            const action = $(this).data('action');
            const messageElement = $(this).closest('.message-content');
            const messageMetadataElement = $(this).closest('.message-metadata');
            const messageText = messageElement.find('span').text();

            switch(action) {
                case 'copy':
                    navigator.clipboard.writeText(messageText);
                    break;
                case 'reply':
                    console.log('Reply to:', messageText);
                    break;
                case 'forward':
                    console.log('Forward:', messageText);
                    break;
                case 'select':
                    console.log('Select:', messageText);
                    break;
            }

            $(this).closest('.message-actions-menu').hide();
        });
    });

    // Function to fetch the current user email
    async function fetchUserEmail(userId) {
        try {
            const response = await fetch(`/api/users/getEmail?id=${userId}`);
            const userEmail = await response.text();
            return userEmail;
        } catch (error) {
            console.error('Error fetching current user email:', error);
            return -1;
        }
    }

    // Function to fetch the profile picture URL
    async function getProfilePicByRoomId(roomId) {
        try {
            const response = await fetch(`/api/users/getProfilePicByRoomId?roomId=${roomId}`);
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

    // Function to update the profile picture
    async function updateProfilePic() {
        const userId = await fetchCurrentUserId();
        if (userId !== -1) { // Check if userId is valid
            const profilePicBase64 = await getProfilePic(userId);

            // Check if the base64 string is not empty
            if (profilePicBase64) {
                // Set the image source with the correct format
                document.getElementById('profilePic').src = `data:image/png;base64,${profilePicBase64}`;
            } else {
                console.error('Profile picture data is empty');
            }
        } else {
            console.error('Invalid user ID');
        }
    }

    // Call the function to update the profile picture
    updateProfilePic();

    localStorage.setItem("roomId", 0);
    document.getElementById("sendMessage").addEventListener("click", () => sendMessage(localStorage.getItem("roomId")));

    messageInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent default action (like adding a new line)
            const messageText = messageInput.value.trim();
            if (messageText) {
                document.getElementById("sendMessage").click();
            }
        }
    });

    document.addEventListener('click', function(event) {
        let target = event.target;

        // Check if the clicked element or any of its parent elements has the class "invite-item"
        while (target) {
            if (target.classList && target.classList.contains('invite-item')) {
                // Get all elements with the class "invite-item"
                const inviteItems = document.querySelectorAll('.invite-item');

                // Remove the class "chat-active-li" from all "invite-item" elements
                inviteItems.forEach(item => {
                    item.classList.remove('chat-active-li');
                });

                // Add the class "chat-active-li" to the clicked element
                target.classList.add('chat-active-li');
                break; // Stop traversing up the DOM
            }
            target = target.parentNode; // Move to the parent element
        }
    });

