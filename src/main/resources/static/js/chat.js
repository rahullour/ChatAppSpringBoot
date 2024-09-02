    document.addEventListener('DOMContentLoaded', function() {
        // Fetch both single and group invites simultaneously
        Promise.all([
            fetchInvites('api/invites/single'),
            fetchInvites('api/invites/group')
        ])
        .then(([singleInvites, groupInvites]) => {
            // Display single invites if available
            if (singleInvites.length > 0) {
                displayInvites(singleInvites, 'single');
            }

            // Display group invites if available
            if (groupInvites.length > 0) {
                displayInvites(groupInvites, 'group');
            }
        })
        .catch(error => {
            console.error('Error fetching invites:', error);
        });
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

    function displayInvites(invites, type) {
        const listId = type === 'single' ? 'single-list' : 'group-list';
        const inviteList = document.getElementById(listId);
        inviteList.innerHTML = '';

        invites.forEach(invite => {
            const inviteItem = document.createElement('li');
            inviteItem.classList.add('invite-item');
            inviteItem.style.cursor = 'pointer';
            if(type == "single"){
               inviteItem.textContent = `${invite.username}`;
               inviteItem.setAttribute('data-room-id', `${invite.roomId}`);
               inviteItem.onclick = () => openChat(`${invite.roomId}`);
           }
           else{
               fetch(`api/invite_groups?inviteId=${invite.id}`)
                   .then(response => {
                       if (!response.ok) {
                           throw new Error('Network response was not ok');
                       }
                       return response.json();
                   })
                   .then(inviteGroup => {
                       return fetch(`api/user_groups?groupId=${inviteGroup.userGroup.id}`);
                   })
                   .then(response => {
                       if (!response.ok) {
                           throw new Error('Network response was not ok');
                       }
                       return response.json();
                   })
                   .then(userGroup => {
                      inviteItem.textContent = `${userGroup.name}`;
                      inviteItem.setAttribute('data-room-id', `${invite.roomId}`);
                      inviteItem.onclick = () => openChat(`${invite.roomId}`);
                   })
                   .catch(error => console.error('Error fetching group data:', error));
              }
            inviteList.appendChild(inviteItem);
        });
    }

    function openChat(roomId) {
        // Logic to open chat messages screen based on roomId
        localStorage.setItem("roomId", roomId);
        displayMessages(roomId);
        console.log(`Opening chat for room ID: ${roomId}`);
    }


    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
    // import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-analytics.js";
      import { getFirestore, collection, getDocs, addDoc, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
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
    // Function to send a message
    async function sendMessage(roomId) {
        const messageInput = document.getElementById("messageInput");
        const messageText = messageInput.value;

        // Check if the message is not empty
        if (messageText.trim() === "") {
            alert("Please enter a message.");
            return;
        }

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
            messageInput.value = ""; // Clear the input field

            // Fetch and display all messages
            await displayMessages(roomId);

            // Fetch and append the last message
            await fetchLastMessage(roomId);

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
                    const profilePicBase64 = await fetchProfilePicture(data.senderId);
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
    }




    // Function to fetch the current user ID
    async function fetchCurrentUserId() {
        try {
            const response = await fetch(`/api/users/currentUser/getId`);
            const userId = await response.json();
            return userId;
        } catch (error) {
            console.error('Error fetching current user ID:', error);
            return -1; // Return a default value in case of an error
        }
    }

    // Function to fetch the profile picture URL
    async function fetchProfilePicture(senderId) {
        try {
            const response = await fetch(`/api/users/getProfilePic?id=${senderId}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json(); // Parse the JSON response
            return data.profilePicture; // Return the base64 string from the JSON object
        } catch (error) {
            console.error('Error fetching profile picture:', error);
            return ''; // Return an empty string in case of an error
        }
    }


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

             querySnapshot.forEach((doc) => {
                 const data = doc.data();
                 const messageElement = document.createElement("div");
                 messageElement.classList.add("message");

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

                 // Add the formatted date to the message
                 messageElement.innerHTML = `
                     <span>${data.text}</span><br>
                     <small>${dateDisplay}</small>
                     <hr>
                 `;

                 const messagesContainer = document.getElementById("messages");
                 messagesContainer.appendChild(messageElement);
             });
         } catch (e) {
             console.error("Error fetching last message: ", e);
         }
     }

    localStorage.setItem("roomId", 0);
    document.getElementById("sendMessage").addEventListener("click", () => sendMessage(localStorage.getItem("roomId")));