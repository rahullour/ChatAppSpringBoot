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
            inviteItem.style.cursor = 'pointer'; // Make it clear that the item is clickable
            let senderIdVar = 0;
            if (type === 'single') {
                const senderEmail = invite.senderEmail;
                const recipientEmail = invite.recipientEmail;

                fetch(`api/users/getId?email=${senderEmail}`)
                    .then(response => response.json())
                    .then(senderId => {
                        return fetch(`api/users/getId?email=${recipientEmail}`)
                            .then(response => response.json())
                            .then(recipientId => {
                                const roomId = `single_${senderId}_${recipientId}`;
                                inviteItem.textContent = `${recipientEmail}`;
                                inviteItem.setAttribute('data-room-id', roomId);
                                inviteItem.onclick = () => openChat(roomId);
                            });
                    })
                    .catch(error => console.error('Error fetching user IDs:', error));
           } else {
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
                            return fetch(`api/users/getId?email=${invite.senderEmail}`)
                                .then(response => {
                                    if (!response.ok) {
                                        throw new Error('Network response was not ok');
                                    }
                                    return response.json();
                                })
                                .then(senderId => {
                                    const roomId = `group_${userGroup.name}_${senderId}`;
                                    inviteItem.textContent = `${userGroup.name}`;
                                    inviteItem.setAttribute('data-room-id', roomId);
                                    inviteItem.onclick = () => openChat(roomId);
                                });
                        })
                        .catch(error => console.error('Error fetching user IDs:', error));

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
            displayMessages(roomId); // Refresh the message display
          } catch (e) {
            console.error("Error adding document: ", e);
          }
        }

    // Function to display messages in the chat
    async function displayMessages(roomId) {
      const messagesContainer = document.getElementById("messages");
      messagesContainer.innerHTML = ""; // Clear existing messages
      try {
        // Get a reference to the Messages collection and order by timestamp
        const messagesQuery = query(collection(db, "Messages"), where("roomId", "==", roomId), orderBy("timestamp"));
        const querySnapshot = await getDocs(messagesQuery);

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const messageElement = document.createElement("div");
          messageElement.classList.add("message");
          messageElement.innerHTML = `
            <strong>Sender ID: ${data.senderId}</strong><br>
            <span>${data.text}</span><br>
            <small>${new Date(data.timestamp.toDate()).toLocaleString()}</small>
            <hr>
          `;
          messagesContainer.appendChild(messageElement);
        });
      } catch (e) {
        console.error("Error fetching messages: ", e);
      }
    }
    localStorage.setItem("roomId", 0);
    document.getElementById("sendMessage").addEventListener("click", () => sendMessage(localStorage.getItem("roomId")));