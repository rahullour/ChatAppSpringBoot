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
            // Display single invites if available
            if (singleInvites.length > 0) {
                await displayInvites(singleInvites, 'single');
                const singleListItems = document.querySelectorAll('#single-list li');
                if (singleListItems.length > 0) {
                    document.querySelector('#one-to-one-tab').click();
                    singleListItems[0].click();
                }
            }

            // Display group invites if available
            if (groupInvites.length > 0) {
                await displayInvites(groupInvites, 'group');
                const groupListItems = document.querySelectorAll('#group-list li');
                if (groupListItems.length > 0 && singleInvites.length === 0) {
                    document.querySelector('#group-chats-tab').click();
                    groupListItems[0].click();
                }
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

                // Set up Firestore listener for real-time updates after processing invites
                const messagesQuery = query(
                    collection(db, "Messages"),
                    where("roomId", "==", `${invite.roomId}`),
                    orderBy("timestamp", "asc")
                );

//                onSnapshot(messagesQuery, (snapshot) => {
//                    if(sessionStorage.getItem("item_clicked") == 'false'){
//                        displayMessages(localStorage.getItem("roomId"));
//                    }
//                    sessionStorage.setItem("item_clicked", 'false');
//                });
                onSnapshot(messagesQuery, (snapshot) => {
                    handleNewMessages(snapshot, localStorage.getItem("roomId"));
                });

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
            // Set up Firestore listener for real-time updates after processing invites
            for (const roomId in groupedInvites) {
                const messagesQuery = query(
                    collection(db, "Messages"),
                    where("roomId", "==", roomId),
                    orderBy("timestamp", "asc") // Order messages by timestamp ascending
                );

                onSnapshot(messagesQuery, (snapshot) => {
                    if(sessionStorage.getItem("item_clicked") == 'false'){
                        displayMessages(roomId);
                    }
                    sessionStorage.setItem("item_clicked", 'false');
                });
            }
        }
    }

    async function handleNewMessages(snapshot, roomId) {
        const messagesContainer = document.getElementById("messages");
        if (!messagesContainer) return;

        const currentUserId = await fetchCurrentUserId();
        let lastReadMessageId = null;
        let lastReadByUsers = [];

        snapshot.docChanges().forEach(async (change) => {
            if (change.type === "added") {
                const data = change.doc.data();
                const messageId = data.messageId;
                const isCurrentUser = data.senderId === currentUserId;

                // Remove previous "read by" if the last message was not read by multiple users
                const lastMessageWrapper = messagesContainer.querySelector(".message-wrapper:last-of-type");
                if (lastMessageWrapper) {
                    const lastReadByWrapper = lastMessageWrapper.nextElementSibling;
                    if (lastReadByWrapper && lastReadByWrapper.classList.contains("read-by-wrapper")) {
                        lastReadByWrapper.remove();
                    }
                }

                // Create new message element
                const messageWrapper = document.createElement("div");
                messageWrapper.classList.add("message-wrapper", isCurrentUser ? "current-user" : "other-user");
                messageWrapper.setAttribute("data-message-id", messageId);

                const messageContent = document.createElement("div");
                messageContent.classList.add("message-content");

                const textElement = document.createElement("span");
                textElement.textContent = data.text;
                messageContent.appendChild(textElement);

                const messageDate = new Date(data.timestamp.toDate());
                const options = { hour: 'numeric', minute: 'numeric', hour12: true };
                const dateElement = document.createElement("div");
                dateElement.classList.add("message-date");
                dateElement.textContent = messageDate.toLocaleTimeString(undefined, options);
                messageContent.appendChild(dateElement);

                if (!isCurrentUser) {
                    const profilePicBase64 = await getProfilePic(data.senderId);
                    const imgElement = document.createElement("img");
                    imgElement.src = `data:image/png;base64,${profilePicBase64}`;
                    imgElement.classList.add("profile-pic");
                    messageWrapper.appendChild(imgElement);
                }

                messageWrapper.appendChild(messageContent);
                messagesContainer.appendChild(messageWrapper);

                if (data.readBy && data.readBy.length > 1) {
                    lastReadMessageId = messageId;
                    lastReadByUsers = data.readBy;
                }
            }
        });

        // Auto-scroll to bottom
        const chatMessagesBox = document.querySelector('.message-container');
        chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;

        // Mark new messages as read
        markMessagesAsRead(roomId);

        // Display read-by indicators correctly
        if (lastReadMessageId) {
            displayReadByUsers(lastReadMessageId, lastReadByUsers, roomId);
        }
    }

    let currentMessagesSubscription = null;
    async function openChat(roomId) {
        console.log(`Opening chat for room ID: ${roomId}`);
        displayMessages(roomId);
        sessionStorage.setItem("item_clicked", 'true');
        localStorage.setItem("roomId", roomId);
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
      import { getFirestore, collection, getDocs, getDoc, doc, addDoc, query, orderBy, where, limit, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
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

    async function addReadByField() {
        const messagesRef = collection(db, "Messages");
        const q = query(messagesRef, limit(1));  // Fetch only the first document
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const firstDoc = querySnapshot.docs[0];
            const firstDocData = firstDoc.data();

            // If the first document already has 'readBy', assume all do and exit
            if (firstDocData.hasOwnProperty("readBy")) {
                console.log("readBy field already exists, no update needed.");
                return;
            }
        }

        console.log("Updating all documents to add readBy field...");

        // Since first doc didn't have 'readBy', update all documents
        const allDocsSnapshot = await getDocs(messagesRef);
        allDocsSnapshot.forEach(async (messageDoc) => {
            const docRef = doc(db, "Messages", messageDoc.id);
            await updateDoc(docRef, { readBy: [] });
            console.log(`Updated doc: ${messageDoc.id}`);
        });

        console.log("All documents updated.");
    }

    // Call function once
    addReadByField().then(() => console.log("Done checking/updating documents"));

    // Function to send a message
    async function sendMessage(roomId) {
        const messageInput = document.getElementById("messageInput");
        const messageText = messageInput.value;
        messageInput.value = ""; // Clear the input field

        try {
            const senderId = await fetch(`/api/users/currentUser/getId`)
                .then(response => response.json())
                .catch(error => {
                    console.error('Error fetching current user', error);
                    return -1;
                });

            const docRef = await addDoc(collection(db, "Messages"), {
                isSeen: false,
                roomId: roomId,
                senderId: senderId,
                text: messageText,
                timestamp: new Date()
            });
            await updateDoc(docRef, { messageId: docRef.id });
            console.log("Document written with ID: ", docRef.id);

        } catch (e) {
            console.error("Error adding document: ", e);
        }
    }

    let displayMessagesTimeout = null;

    async function displayMessages(roomId) {
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
            let lastReadMessageId = null;
            let lastReadByUsers = [];
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

                    if (data.readBy && data.readBy.length > 1) {
                        lastReadMessageId = data.messageId;
                        lastReadByUsers = data.readBy;
                    }
                }
            } catch (e) {
                console.error("Error fetching messages: ", e);
            }

            const chatMessagesBox = document.querySelector('.message-container');
            chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;

            markMessagesAsRead(roomId);

            if (lastReadMessageId) {
                displayReadByUsers(lastReadMessageId, lastReadByUsers, roomId);
            }
        }, 300);
    }

    async function displayReadByUsers(messageId, readByUsers, roomId) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageElement) return;

        const messageWrapper = messageElement.closest(".message-wrapper");
        if (!messageWrapper) return;

        // Check if a ReadBy wrapper already exists after this messageWrapper
        let readByWrapper = messageWrapper.nextElementSibling;
        if (readByWrapper && readByWrapper.classList.contains("read-by-wrapper")) {
            readByWrapper.innerHTML = ""; // Clear existing readBy avatars
        } else {
            // Create a new message-wrapper div for read receipts
            readByWrapper = document.createElement("div");
            readByWrapper.classList.add("message-wrapper", "read-by-wrapper", "justify-content-end");
            readByWrapper.style.display = "flex";
            readByWrapper.style.alignItems = "center";
            readByWrapper.style.marginTop = "3px";
        }

        // Create the readByContainer inside the new message-wrapper
        let readByContainer = document.createElement("div");
        readByContainer.classList.add("read-by-container");
        readByContainer.style.display = "flex";
        readByContainer.style.marginTop = "5px";

        const currentUserId = await fetchCurrentUserId();
        const isGroupChat = roomId.startsWith("group_"); // Assuming group chats have a "group_" prefix

        for (const userId of readByUsers) {
            if (userId === currentUserId) continue; // Skip own read receipt

            const userProfilePic = await getProfilePic(userId);
            if (!userProfilePic) continue;

            // Fetch the username using the API
            const username = await fetch(`/api/users/getUsername?id=${userId}`)
                .then(response => response.text())
                .catch(error => {
                    console.error('Error fetching username:', error);
                    return `User ${userId}`; // Fallback if API fails
                });

            const imgElement = document.createElement("img");
            imgElement.src = `data:image/png;base64,${userProfilePic}`;
            imgElement.classList.add("read-by-avatar");
            imgElement.style.width = "18px";
            imgElement.style.height = "18px";
            imgElement.style.borderRadius = "50%";
            imgElement.title = `Read by ${username}`;

            readByContainer.appendChild(imgElement);

            if (!isGroupChat) break; // In one-to-one chat, show only one image
        }

        // Append readByContainer inside readByWrapper
        readByWrapper.appendChild(readByContainer);

        // Insert the new message-wrapper right after the existing message-wrapper
        messageWrapper.insertAdjacentElement("afterend", readByWrapper);
        const chatMessagesBox = document.querySelector('.message-container');
        chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
    }



    // **Function to mark messages as read when they become visible**
    async function markMessagesAsRead(roomId) {
        const currentUserId = await fetchCurrentUserId();
        if (!currentUserId || currentUserId === -1) return;

        const messagesContainer = document.getElementById("messages");
        if (!messagesContainer) return;

        // Use IntersectionObserver to track visibility of messages
        const observer = new IntersectionObserver(async (entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    const messageElement = entry.target;
                    const messageId = messageElement.querySelector(".message-metadata")?.dataset.messageId;

                    if (!messageId) continue; // Skip if no message ID

                    const messageRef = doc(db, "Messages", messageId);

                    try {
                        // Fetch current message data
                        const messageDoc = await getDoc(messageRef);
                        if (!messageDoc.exists()) continue;

                        const messageData = messageDoc.data();
                        const readBy = messageData.readBy || [];

                        // Update Firestore only if the user hasn't already read the message
                        if (!readBy.includes(currentUserId)) {
                            await updateDoc(messageRef, {
                                readBy: [...readBy, currentUserId]
                            });
                            console.log(`Message ${messageId} marked as read by ${currentUserId}`);
                        }
                    } catch (error) {
                        console.error("Error updating readBy field:", error);
                    }
                }
            }
        }, { threshold: 0.8 }); // Trigger when 80% of the message is visible

        // Observe all messages inside the chat
        const messages = messagesContainer.querySelectorAll(".message-wrapper");
        messages.forEach(message => {
            observer.observe(message);
        });
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
