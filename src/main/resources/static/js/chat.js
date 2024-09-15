document.addEventListener('DOMContentLoaded', async function() {
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
                chatMessagesBox.innerText = "You don't have any conversation, invite someone!";
                chatMessagesBox.style.verticalAlign = 'middle';
                chatMessagesBox.style.textAlign = 'center';
                chatMessagesBox.style.margin = 'auto';
            }
        }
    } catch (error) {
        console.error('Error fetching invites:', error);
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

        for (const invite of invites) {
            const inviteItem = document.createElement('li');
            inviteItem.classList.add('invite-item');
            inviteItem.style.cursor = 'pointer';

            if (type === "single") {
                try {
                    // Fetch user ID based on email
                    const userIdResponse = await fetch(`api/users/getId?email=${invite.recipientEmail}`);
                    if (!userIdResponse.ok) {
                        throw new Error('getUserIdByEmail response was not ok');
                    }
                    const userId = await userIdResponse.json();

                    // Create a wrapper for the invite item
                    const inviteWrapper = document.createElement('div');
                    inviteWrapper.classList.add('invite-wrapper');

                    if (userId) {
                        const profilePicBase64 = await getProfilePic(userId);
                        const imgElement = document.createElement("img");
                        imgElement.src = `data:image/png;base64,${profilePicBase64}`;
                        imgElement.classList.add("profile-pic");
                        inviteWrapper.appendChild(imgElement);
                    }

                    const usernameResponse = await fetch(`api/users/getUserNameByEmail?email=${invite.recipientEmail}`);
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
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            } else {
                // Handle group invites
                try {
                    const groupResponse = await fetch(`api/invite_groups?inviteId=${invite.id}`);
                    if (!groupResponse.ok) {
                        throw new Error('Network response was not ok');
                    }
                    const inviteGroup = await groupResponse.json();
                    const userGroupResponse = await fetch(`api/user_groups?groupId=${inviteGroup.userGroup.id}`);
                    if (!userGroupResponse.ok) {
                        throw new Error('Network response was not ok');
                    }
                    const userGroup = await userGroupResponse.json();
                    inviteItem.textContent = `${userGroup.name}`;
                    inviteItem.setAttribute('data-room-id', `${invite.roomId}`);
                    inviteItem.onclick = () => openChat(`${invite.roomId}`);
                } catch (error) {
                    console.error('Error fetching group data:', error);
                }
            }

            inviteList.appendChild(inviteItem);
        }
    }

    function openChat(roomId) {
        // Logic to open chat messages screen based on roomId
        localStorage.setItem("roomId", roomId);
        console.log(`Opening chat for room ID: ${roomId}`);
    }


    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
    // import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-analytics.js";
      import { getFirestore, collection, getDocs, addDoc, query, orderBy, where, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
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

    let lastMessageCount = 0; // Variable to track the number of messages displayed

    const messagesQuery = query(
        collection(db, "Messages"),
        where("roomId", "==", localStorage.getItem("roomId")),
        orderBy("timestamp", "asc") // Order messages by timestamp ascending
    );

    let timeoutId;
    onSnapshot(messagesQuery, (snapshot) => {
        const newMessageCount = snapshot.docChanges().filter(change => change.type === "added").length;

        if (newMessageCount > 0 && newMessageCount !== lastMessageCount) {
            clearTimeout(timeoutId); // Clear the previous timeout
            timeoutId = setTimeout(() => {
                lastMessageCount = newMessageCount;
                displayMessages(localStorage.getItem("roomId"));
            }, 100); // Delay the call to displayMessages
        }
    });

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

            console.log("Document written with ID: ", docRef.id);

        } catch (e) {
            console.error("Error adding document: ", e);
        }
    }

    async function displayMessages(roomId) {
        const messagesContainer = document.getElementById("messages");
        messagesContainer.innerHTML = ""; // Clear existing messages

        try {
            // Get a reference to the Messages collection and order by timestamp in ascending order
            const messagesQuery = query(
                collection(db, "Messages"),
                where("roomId", "==", roomId),
                orderBy("timestamp", "asc") // Order messages by timestamp ascending
            );

            const querySnapshot = await getDocs(messagesQuery);

            // Create an array to hold the messages for later processing
            const messages = [];

            // Collect messages from the querySnapshot
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                messages.push(data); // Push the message data to the array
            });

            // Display each message
            const currentUserId = await fetchCurrentUserId(); // Fetch current user ID
            const now = new Date();

            for (const data of messages) {
                const messageElement = document.createElement("div");
                const isCurrentUser = data.senderId === currentUserId;

                // Create a wrapper for the message
                const messageWrapper = document.createElement("div");
                messageWrapper.classList.add("message-wrapper", isCurrentUser ? "current-user" : "other-user");

                // Create the message content
                const messageContent = document.createElement("div");
                messageContent.classList.add("message-content");

                // Format the date
                const messageDate = new Date(data.timestamp.toDate());
                const options = { hour: 'numeric', minute: 'numeric', hour12: true }; // Options for time formatting
                let dateDisplay;

                // Check conditions for displaying date and time
                const isSameMonth = messageDate.getMonth() === now.getMonth() && messageDate.getFullYear() === now.getFullYear();
                const isSameDate = messageDate.getDate() === now.getDate() && isSameMonth;

                if (isSameDate) {
                    // Show only time (12-hour format)
                    dateDisplay = messageDate.toLocaleTimeString(undefined, options);
                } else if (isSameMonth) {
                    // Show date and time (12-hour format)
                    dateDisplay = `${messageDate.getDate()} ${messageDate.toLocaleTimeString(undefined, options)}`;
                } else {
                    // Show date, month, and time (12-hour format)
                    const month = messageDate.toLocaleString('default', { month: 'long' });
                    dateDisplay = `${messageDate.getDate()} ${month} ${messageDate.toLocaleTimeString(undefined, options)}`;
                }

                // Add date to the message content
                const dateElement = document.createElement("div");
                dateElement.classList.add("message-date");
                dateElement.textContent = dateDisplay; // Show formatted date
                messageContent.appendChild(dateElement);

                // Add message text
                const textElement = document.createElement("span");
                textElement.textContent = data.text;
                messageContent.appendChild(textElement);

                // Append profile picture for non-current users
                if (!isCurrentUser) {
                    const profilePicBase64 = await getProfilePic(data.senderId);
                    const imgElement = document.createElement("img");
                    imgElement.src = `data:image/png;base64,${profilePicBase64}`;
                    imgElement.classList.add("profile-pic");
                    messageWrapper.appendChild(imgElement);
                }

                messageWrapper.appendChild(messageContent);
                messagesContainer.appendChild(messageWrapper);
            }
        } catch (e) {
            console.error("Error fetching messages: ", e);
        }
        const chatMessagesBox = document.querySelector('.message-container');
        chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
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

    async function fetchLastMessage(roomId) {
        try {
            // Get a reference to the Messages collection, order by timestamp, and limit to the last message
            const lastMessageQuery = query(
                collection(db, "Messages"),
                where("roomId", "==", roomId),
                orderBy("timestamp", "desc"),
                limit(1) // Limit to the last message
            );

            const querySnapshot = await getDocs(lastMessageQuery);

            // Append last message directly without clearing previous messages
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const messageElement = document.createElement("div");
                // Create a wrapper for the message
                const messageWrapper = document.createElement("div");
                messageWrapper.classList.add("message-wrapper", "current-user");

                // Create the message content
                const messageContent = document.createElement("div");
                messageContent.classList.add("message-content");

                // Format the date
                const messageDate = new Date(data.timestamp.toDate());
                const now = new Date();
                const options = { hour: 'numeric', minute: 'numeric', hour12: true }; // Options for time formatting
                let dateDisplay;

                // Check conditions for displaying date and time
                const isSameMonth = messageDate.getMonth() === now.getMonth() && messageDate.getFullYear() === now.getFullYear();
                const isSameDate = messageDate.getDate() === now.getDate() && isSameMonth;

                if (isSameDate) {
                    // Show only time (12-hour format)
                    dateDisplay = messageDate.toLocaleTimeString(undefined, options);
                } else if (isSameMonth) {
                    // Show date and time (12-hour format)
                    dateDisplay = `${messageDate.getDate()} ${messageDate.toLocaleTimeString(undefined, options)}`;
                } else {
                    // Show date, month, and time (12-hour format)
                    const month = messageDate.toLocaleString('default', { month: 'long' });
                    dateDisplay = `${messageDate.getDate()} ${month} ${messageDate.toLocaleTimeString(undefined, options)}`;
                }

                // Add date to the message content
                const dateElement = document.createElement("div");
                dateElement.classList.add("message-date");
                dateElement.textContent = dateDisplay; // Show formatted date
                messageContent.appendChild(dateElement);

                // Add message text
                const textElement = document.createElement("span");
                textElement.textContent = data.text;
                messageContent.appendChild(textElement);

                messageWrapper.appendChild(messageContent);

                // Append the last message to the last message container
                const lastMessageContainer = document.getElementById("messages");
                lastMessageContainer.appendChild(messageWrapper);
            });
        } catch (e) {
            console.error("Error fetching last message: ", e);
        }
        const chatMessagesBox = document.querySelector('.message-container');
        chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
    }

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

