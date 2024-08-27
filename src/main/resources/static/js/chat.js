// Import the functions you need from the SDKs you need
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
    // import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-analytics.js";
      import { getFirestore, collection, getDocs, addDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
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
    async function sendMessage() {
        const messageInput = document.getElementById("messageInput");
        const messageText = messageInput.value;

        // Check if the message is not empty
        if (messageText.trim() === "") {
            alert("Please enter a message.");
            return;
        }

        try {
            const docRef = await addDoc(collection(db, "Messages"), {
                isSeen: false,
                roomId: "", // Set the roomId as needed
                senderId: "1", // Replace with the actual senderId (e.g., user ID)
                text: messageText,
                timestamp: new Date().toISOString() // Use the current timestamp
            });
            console.log("Document written with ID: ", docRef.id);
            messageInput.value = ""; // Clear the input field
            displayMessages(); // Refresh the message display
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    }

    // Function to display messages in the chat
    async function displayMessages() {
        const messagesContainer = document.getElementById("messages");
        messagesContainer.innerHTML = ""; // Clear existing messages

        try {
            // Get a reference to the Messages collection and order by timestamp
            const messagesQuery = query(collection(db, "Messages"), orderBy("timestamp"));
            const querySnapshot = await getDocs(messagesQuery);

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const messageElement = document.createElement("div");
                messageElement.classList.add("message");
                messageElement.innerHTML = `
                    <strong>Sender ID: ${data.senderId}</strong><br>
                    <span>${data.text}</span><br>
                    <small>${new Date(data.timestamp).toLocaleString()}</small>
                    <hr>
                `;
                messagesContainer.appendChild(messageElement);
            });
        } catch (e) {
            console.error("Error fetching messages: ", e);
        }
    }

    // Event listener for sending messages
    document.getElementById("sendMessage").addEventListener("click", sendMessage);

    // Initial call to display messages when the page loads
    displayMessages();