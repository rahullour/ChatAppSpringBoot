let stompClient = null;
let notificationCount = 0;
let offlineNotification;
let currentReplyMessageId = null;
let currentEditingMessageId = null;
let currentDeletingMessageId = null;

window.parseDateFromHeader = function(dateString) {
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


window.downloadFile = async function (messageId) {
    const messageWrapper = document.querySelector(`.message-wrapper[data-message-id="${messageId}"]`);
    if (!messageWrapper) {
        console.warn("Message wrapper not found for messageId:", messageId);
        return;
    }

    // Fetch attachments for the message
    const attachmentsByMessageId = await fetchAttachmentsForMessages([messageId]);
    const attachments = attachmentsByMessageId[messageId] || [];

    if (attachments.length === 0) {
        console.warn("No attachments found for message:", messageId);
        return;
    }

    try {
        // Download all attachments in parallel
        await Promise.all(attachments.map(async (attachment) => {
            const response = await fetch(`/api/files/download?url=${encodeURIComponent(attachment.downloadUrl)}`);
            if (!response.ok) throw new Error(`Failed to download ${attachment.fileName}`);

            const blob = await response.blob();
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = attachment.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }));
    } catch (error) {
        console.error("Error downloading files:", error);
    }
};

window.messageReply = async function(messageId) {
    closeEdit();
    const messageWrapper = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageWrapper) return;
    const messageContent = messageWrapper.querySelector('.message-content');
    const editorWrapper = document.querySelector('.editor-wrapper');
    const senderId = messageWrapper.querySelector('.message-metadata').innerText.match(/senderId:\s*(\d+)/)[1];
    var senderName = null;

    fetch(`/api/users/getUsername?id=${Number(senderId)}`)
        .then(response => {
            if (!response.ok) throw new Error("Failed to fetch username");
            return response.text();
        })
        .then(username => {
            senderName = username;
            const timestamp = messageWrapper.querySelector('.message-date')?.textContent || "Unknown Time"; // Extract timestamp

                // Remove existing reply preview if any
                const existingPreview = document.querySelector('.message-reply-preview');
                if (existingPreview) {
                    existingPreview.remove();
                }

                // Extract only the allowed elements from `messageContent`
                const messageText = document.createElement("div");

                // Keep `.attachments-container`
                const attachmentsContainer = messageContent.querySelector('.attachments-container');
                if (attachmentsContainer) {
                    messageText.appendChild(attachmentsContainer.cloneNode(true));
                }
                // Keep `<span>` elements (actual message text) but NOT inside `.reaction-picker` or `.reaction-display`
                const textSpans = messageContent.querySelector('span');
                messageText.appendChild(textSpans.cloneNode(true));
                // Find the parent div `.reaction-display`
                const reactionDisplay = messageContent.querySelector(".reaction-display");

                if (reactionDisplay) {
                    // Clone the entire reaction-display and rename its class
                    const reactionDisplayClone = reactionDisplay.cloneNode(true);
                    reactionDisplayClone.classList.replace("reaction-display", "reaction-display-reply");
                    reactionDisplayClone.classList.remove("reaction-display-right");

                    // Append the modified reaction-display to messageText (after text spans)
                    messageText.appendChild(reactionDisplayClone);
                }
                // Create reply preview
                const replyPreview = document.createElement('div');
                replyPreview.className = 'message-reply-preview active';
                replyPreview.innerHTML = `
                    <div class="reply-container">
                        <!-- Top Bar: Houses the left indicator and the right close icon -->
                        <div class="reply-header">
                            <div class="reply-indicator">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="reply-svg-icon" id="reply">
                                    <linearGradient id="a" x1="169.657" x2="406.21" y1="131.461" y2="368.014" gradientTransform="matrix(1 0 0 -1 0 514)" gradientUnits="userSpaceOnUse">
                                        <stop offset="0" stop-color="#332c81"></stop>
                                        <stop offset="1" stop-color="#e21d73"></stop>
                                    </linearGradient>
                                    <path fill="url(#a)" d="M14.1 191.4 186 43c15-13 38.8-2.4 38.8 17.7v78.2C381.6 140.7 506 172.1 506 320.8c0 60-38.7 119.4-81.4 150.5-13.3 9.7-32.3-2.5-27.4-18.2 44.3-141.6-21-179.2-172.5-181.4v85.9c0 20.2-23.7 30.7-38.8 17.7L14.1 226.9c-10.8-9.4-10.8-26.2 0-35.5z"></path>
                                </svg> 
                                <span>Replying Message</span>
                            </div>
                            
                            <div class="close-reply" onclick="closeReply()">
                                <!-- Fixed typo: height="20 " had extra spaces -->
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </div>
                        </div>
                        
                        <!-- Bottom Content: Message text body and metadata info stack -->
                        <div class="reply-content">
                            <div class="reply-text-body">${messageText.innerHTML}</div>
                            <div class="reply-meta">${senderName}, ${timestamp}</div>
                        </div>
                    </div>
                `;

                // Insert preview before the editor
                editorWrapper.insertBefore(replyPreview, editorWrapper.firstChild);
                editorWrapper.classList.add('reply-active');

                // Store reply message ID
                currentReplyMessageId = messageId;

                // Focus the editor
                document.querySelector('trix-editor').focus();
        })
        .catch(error => {
            console.error("Error fetching username:", error);
        });
};

// trix toolbar dyamic positioning on message-edit-preview/message-reply-preview close
window.resetToolbar = function () {
    const toggleBtn = document.querySelector(".toolbar-toggle-btn");

    // Check if the button exists and if it contains the 'active' class
    if (toggleBtn && toggleBtn.classList.contains("active")) {
        toggleBtn.click();
    }
}

window.closeReply = function() {
    resetToolbar();
    const replyPreview = document.querySelector('.message-reply-preview');
    const editorWrapper = document.querySelector('.editor-wrapper');

    if (replyPreview) {
        replyPreview.remove();
        editorWrapper.classList.remove('reply-active');
        currentReplyMessageId = null;
    }
};

window.editMessage = async function (messageId) {
    closeReply();
    const messageWrapper = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageWrapper) return;

    const messageContent = messageWrapper.querySelector(".message-content");
    const editorWrapper = document.querySelector(".editor-wrapper");
    const trixEditor = document.querySelector("trix-editor");

    // Prevent multiple edits at once
    const existingPreview = document.querySelector(".message-edit-preview");
    if (existingPreview) existingPreview.remove();

    // Extract sender name from metadata
    const senderIdMatch = messageWrapper.querySelector(".message-metadata")?.innerText.match(/senderId:\s*(\d+)/);
    if (!senderIdMatch) return;
    const senderId = senderIdMatch[1];

    const timestamp = messageWrapper.querySelector(".message-date")?.textContent || "Unknown Time";

    // Extract message text (including rich text formatting)
    const textSpan = messageContent.querySelector('span:not(.message-reply-reference > span)');
    const messageHtml = textSpan.cloneNode(true);

    // Clean up indicators
    let editedIndicator = messageHtml.querySelector(".edited-indicator");
    if (editedIndicator) editedIndicator.remove();

    // Extract attachments and remove the image hover text
    const attachmentsContainer = messageContent.querySelector(".attachments-container");
    let attachmentsHtml = "";
    if (attachmentsContainer) {
        const clonedAttachments = attachmentsContainer.cloneNode(true);
        clonedAttachments.querySelectorAll(".image-wrapper .image-hover-text").forEach(el => el.remove());
        attachmentsHtml = clonedAttachments.outerHTML;
    }

    // LOAD CONTENT INTO TRIX INSTANTLY FOR MAX RESPONSIVENESS
    const fullContent = messageHtml.innerHTML + attachmentsHtml;
    trixEditor.editor.loadHTML(fullContent);
    currentEditingMessageId = messageId;

    // RENDER PREVIEW BOX IMMEDIATELY WITH A LOADING PLACEHOLDER
    const editPreview = document.createElement("div");
    editPreview.className = "message-edit-preview active";
    editPreview.innerHTML = `
        <div class="edit-container">
            <div class="edit-header">
                <span class="edit-icon">✏️ Editing Message</span>
                <button class="close-edit" onclick="closeEdit()">✕</button>
            </div>
            <div class="edit-meta">
                <strong id="edit-preview-username">Loading...</strong> • <span>${timestamp}</span>
            </div>
            <div class="edit-preview-content">${messageHtml.innerHTML}</div>
        </div>
    `;

    editorWrapper.insertBefore(editPreview, editorWrapper.firstChild);
    editorWrapper.classList.add("edit-active");
    trixEditor.focus();

    // FETCH USERNAME IN THE BACKGROUND WITHOUT BLOCKING THE UI
    try {
        const response = await fetch(`/api/users/getUsername?id=${Number(senderId)}`);
        if (!response.ok) throw new Error("Failed to fetch username");
        const senderName = await response.text();

        const usernameEl = document.getElementById("edit-preview-username");
        if (usernameEl) usernameEl.textContent = senderName;
    } catch (error) {
        console.error("Error fetching username:", error);
        const usernameEl = document.getElementById("edit-preview-username");
        if (usernameEl) usernameEl.textContent = "User";
    }
};

window.saveEditedMessage = async function () {
    if (!currentEditingMessageId) return;

    const messageWrapper = document.querySelector(`[data-message-id="${currentEditingMessageId}"]`);
    if (!messageWrapper) return;

    const trixEditor = document.querySelector("trix-editor");
    var messageContent = messageWrapper.querySelector(".message-content");

    // Get the formatted message content HTML string
    const messageContentInput = document.getElementById("message-content");
    let newMessageHtml = messageContentInput.value;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = newMessageHtml;

    // Clean DOM markup structural trees for storage saving
    tempDiv.querySelectorAll('figure').forEach(fig => fig.remove());
    tempDiv.querySelectorAll('div').forEach(div => {
        if (div.innerHTML.trim() === '') div.remove();
    });

    newMessageHtml = tempDiv.innerHTML;

    // USE TRIX DATA HERE: Get currently staged file attachments for uploading
    const attachments = trixEditor.editor.getDocument().getAttachments();

    // Filter to capture ONLY new attachments that need to be uploaded (have a file object OR a blob URL)
    const newFileAttachments = attachments.filter(attachment => attachment.file !== null);
    if (newMessageHtml.trim() === "" && attachments.length === 0) {
        alert("Message cannot be empty!");
        return;
    }

    if (attachments.length > 5) {
        showAttachmentLimitNotification();
        return;
    }

    try {
        // Fetch current user verification status
        const senderId = await fetch(`/api/users/currentUser/getId`)
            .then(res => res.json())
            .catch(err => {
                console.error('Error fetching current user', err);
                return -1;
            });
        if (senderId === -1) return;

        // Initialize Batch Operations
        const batch = writeBatch(db);

        // 1. CLEAR EXSTING DATABASE RECORDS: Find and queue deletions for old attachment docs
        const existingSnapshot = await getDocs(
            query(collection(db, "Attachments"), where("messageId", "==", currentEditingMessageId))
        );
        // 1. Initialize an array to hold your parsed attachments
        const initialAttachments = [];

        existingSnapshot.docs.forEach(docSnap => {
            // 2. Safely extract the clean JavaScript object from the Firestore snapshot
            const data = docSnap.data();

            // 3. Push the fields you need into your array
            if (data) {
                initialAttachments.push({
                    id: docSnap.id, // Good practice to keep the Firestore document ID
                    downloadUrl: data.downloadUrl,
                    fileName: data.fileName,
                    fileSize: data.fileSize ? Number(data.fileSize) : 0, // Ensures it's a JS number, not a string
                    fileType: data.fileType,
                    messageId: data.messageId,
                    senderId: data.senderId,
                    timestamp: data.timestamp // This will be a Firestore Timestamp object
                });
            }

            // 4. Proceed with your batch deletion
            batch.delete(docSnap.ref);
        });

        // Update the main message text
        const messageRef = doc(db, "Messages", currentEditingMessageId);
        batch.update(messageRef, { text: newMessageHtml, edited: 1, editRenderedOn: [] });

        // 2. PROCESS CURRENT TRIX ATTACHMENTS
        if (attachments.length > 0) {
            await Promise.all(
                attachments.map(async (attachment) => {
                    let downloadUrl = "";
                    let fileName = "";
                    let fileSize = 0;
                    let fileType = "";

                    if (attachment.file) {
                        // This is a BRAND NEW file (needs uploading)
                        const file = attachment.file;
                        const formData = new FormData();
                        formData.append('file', file);

                        const response = await fetch('/api/files/upload', { method: 'POST', body: formData });
                        if (!response.ok) throw new Error(`Upload failed!`);
                        downloadUrl = await response.text();

                        fileName = file.name;
                        fileSize = file.size;
                        fileType = file.type;
                    } else {
                        // This is an ALREADY UPLOADED file (keep its remote metadata)
                        downloadUrl = attachment.previewURL || attachment.attributes?.values?.url || "";
                        // Fallback text parsing for names from R2/S3 paths if properties are nested
                        fileName = attachment.attributes?.values?.filename || "Attached Image";
                        fileSize = attachment.attributes?.values?.filesize || 0;
                        fileType = "image/png"; // Default fallback
                    }

                    // 3. RE-ADD EVERYTHING FRESH: Create a new doc for every current attachment
                    const attachmentRef = doc(collection(db, "Attachments"));
                    batch.set(attachmentRef, {
                        messageId: currentEditingMessageId,
                        senderId: senderId,
                        fileName: fileName,
                        fileSize: fileSize,
                        fileType: fileType,
                        downloadUrl: downloadUrl,
                        timestamp: new Date()
                    });
                })
            );
        }

        // 4. COMMIT EVERYTHING AT ONCE (Deletions, Updates, and fresh Inserts)
        await batch.commit();

        // 2. FIREBASE SNAPSHOT: Fetch fresh state after uploads/modifications finish
        const updatedSnapshot = await getDocs(
            query(collection(db, "Attachments"), where("messageId", "==", currentEditingMessageId))
        );


        // Map the updated snapshot documents using the standard .data() method
        const updatedAttachments = updatedSnapshot.docs.map(doc => doc.data());

        // Isolate missing items using direct URL references
        // Using optional chaining (?.) and a fallback string protects against missing or null downloadUrls
        const updatedUrls = new Set(
            updatedAttachments.map(att => (att?.downloadUrl || '').trim().toLowerCase())
        );


        // Filter your initialAttachments to find exactly what was removed
        const deletedAttachments = initialAttachments.filter(att => {
            if (!att.downloadUrl) return false;

            const initialUrl = att.downloadUrl.trim().toLowerCase();

            // If an initial item isn't in the updated DB list, it was removed from the message
            return !updatedUrls.has(initialUrl);
        });

        // 4. CLEANUP: Clear global tracking state and purge local file servers
        if (deletedAttachments.length > 0) {
            const urlsToPurge = deletedAttachments.map(att => att.downloadUrl).filter(Boolean);

            // Clean global tracking array safely using the verified list of deleted URLs
            removeMessageAttachmentsFromGlobal(currentEditingMessageId, urlsToPurge);
        }

        // add newAttachments to Images Preview
        const newAttachments = updatedAttachments.filter(updatedAtt => {
            if (!updatedAtt.downloadUrl) return false;

            // Check if this updated attachment does NOT exist anywhere in initialAttachments
            return !initialAttachments.some(initialAtt =>
                initialAtt.downloadUrl && initialAtt.downloadUrl.trim().toLowerCase() === updatedAtt.downloadUrl.trim().toLowerCase()
            );
        });

        if (newAttachments.length > 0) {
            addMessageAttachmentsToGlobal(currentEditingMessageId, newAttachments);
        }


        // Safe DOM Fallback view updates
        let textContent = messageContent.querySelector('span:not(.message-reply-reference > span)');
        if (textContent) textContent.innerHTML = newMessageHtml;

        // Sync local interface mutations using the verified database data
        if (messageContent) {
            const messagesContainer = messageContent.closest("#messages");
            if (messagesContainer) {
                const currentRoomId = messagesContainer.dataset.roomId;
                renderAttachments(updatedAttachments, messageContent, currentRoomId);
            } else {
                console.warn("Could not find the parent messages container in the DOM hierarchy.");
            }
        }

        // SUCCESSFUL RESOLUTION CLOSURE
        closeEdit();
        console.log("Message updated successfully");
        currentEditingMessageId = null;

    } catch (error) {
        console.error("Error updating message:", error);
        alert("Failed to save changes. Please try again.");
    } finally {
        hideLoadingChatNotification();
    }
};

window.closeEdit = function () {
    resetToolbar();
    const editPreview = document.querySelector(".message-edit-preview");
    const editorWrapper = document.querySelector(".editor-wrapper");

    if (editPreview) editPreview.remove();
    if (editorWrapper) editorWrapper.classList.remove("edit-active");

    const trixEditor = document.querySelector("trix-editor");
    if (trixEditor) trixEditor.editor.loadHTML("");
};

// Listen for Trix attachment removal -  to clean left over blank lines after edit message
document.addEventListener("trix-attachment-remove", function(event) {
    const trixEditor = event.target.editor;
    if (!trixEditor) return;

    const doc = trixEditor.getDocument();
    const docString = doc.toString();
    const [position] = trixEditor.getSelectedRange();

    // 1. Look for a double newline artifact anywhere near the deletion cursor
    // This happens specifically when an attachment block is removed
    if (docString.includes("\n\n")) {
        // Find where the double newline is sitting in the document string
        const doubleNewlineIndex = docString.indexOf("\n\n");

        // 2. Target just one of those phantom newlines and delete it surgically
        trixEditor.setSelectedRange([doubleNewlineIndex, doubleNewlineIndex + 1]);
        trixEditor.deleteInDirection("backward");

        // 3. Reset the user's cursor back to where it belongs minus the collapsed space
        const newPosition = Math.max(0, position - 1);
        trixEditor.setSelectedRange(newPosition);
    }
});

function removeMessageAttachmentsFromGlobal(messageId, specificUrls = null) {
    const currentRoomId = localStorage.getItem('roomId');
    const urlsToRemove = new Set();

    // Standardizer to match strings flawlessly regardless of protocol mismatches
    const normalizeUrl = (url) => url ? url.trim().replace(/^https?:\/\//i, '').toLowerCase() : '';

    if (specificUrls && Array.isArray(specificUrls)) {
        // Mode A: Invoked by Save Edit flow (Deletes explicit array matches only)
        specificUrls.forEach(url => {
            if (url) urlsToRemove.add(normalizeUrl(url));
        });
    } else {
        // Mode B: Invoked by Full Delete Flow (Scrapes entire DOM elements container)
        const messageWrapper = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageWrapper) return;

        const attachmentsContainer = messageWrapper.querySelector(".attachments-container");
        if (!attachmentsContainer) return;

        attachmentsContainer.querySelectorAll("img.message-image").forEach(img => {
            if (img.src) urlsToRemove.add(normalizeUrl(img.src));
        });

        attachmentsContainer.querySelectorAll("a.message-file-link").forEach(a => {
            if (a.href) urlsToRemove.add(normalizeUrl(a.href));
        });
    }

    if (urlsToRemove.size === 0) return;

    // Filter global records without side effects
    allImageUrls = allImageUrls.filter(item => {
        const isTargetRoom = item.roomId === currentRoomId;
        const isTargetUrl = urlsToRemove.has(normalizeUrl(item.url));

        // Exclude the record only if it satisfies both room conditions and target items
        return !(isTargetRoom && isTargetUrl);
    });
}

function addMessageAttachmentsToGlobal(messageId, specificAttachments = null) {
    const currentRoomId = localStorage.getItem('roomId');
    if (!currentRoomId) return;

    // Standardizer to match strings flawlessly regardless of protocol mismatches
    const normalizeUrl = (url) => url ? url.trim().replace(/^https?:\/\//i, '').toLowerCase() : '';

    // Create a Set of normalized URLs currently tracked in the global array to prevent duplicates
    const existingUrlsInRoom = new Set(
        allImageUrls
            .filter(item => item.roomId === currentRoomId)
            .map(item => normalizeUrl(item.url))
    );

    // This will temporarily house new, unique items to be pushed globally
    const itemsToAdd = [];

    if (specificAttachments && Array.isArray(specificAttachments)) {
        // Mode A: Invoked by Save/Edit/Receive flow (Takes explicit arrays of attachment objects)
        // Expected format: [{ downloadUrl: '...' }, { downloadUrl: '...' }]
        specificAttachments.forEach(att => {
            if (!att || !att.downloadUrl) return;

            const normalized = normalizeUrl(att.downloadUrl);
            if (!existingUrlsInRoom.has(normalized)) {
                itemsToAdd.push({
                    roomId: currentRoomId,
                    messageId: messageId,
                    url: att.downloadUrl // Store the pristine original URL
                });
                // Add it to our local tracking Set so we don't accidentally add the same item twice within this loop execution
                existingUrlsInRoom.add(normalized);
            }
        });
    } else {
        // Mode B: Invoked by Fallback/Render Flow (Scrapes entire DOM elements container)
        const messageWrapper = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageWrapper) return;

        const attachmentsContainer = messageWrapper.querySelector(".attachments-container");
        if (!attachmentsContainer) return;

        // Process images
        attachmentsContainer.querySelectorAll("img.message-image").forEach(img => {
            if (!img.src) return;

            const normalized = normalizeUrl(img.src);
            if (!existingUrlsInRoom.has(normalized)) {
                itemsToAdd.push({
                    roomId: currentRoomId,
                    messageId: messageId,
                    url: img.src
                });
                existingUrlsInRoom.add(normalized);
            }
        });

        // Process files/documents
        attachmentsContainer.querySelectorAll("a.message-file-link").forEach(a => {
            if (!a.href) return;

            const normalized = normalizeUrl(a.href);
            if (!existingUrlsInRoom.has(normalized)) {
                itemsToAdd.push({
                    roomId: currentRoomId,
                    messageId: messageId,
                    url: a.href
                });
                existingUrlsInRoom.add(normalized);
            }
        });
    }

    // Append the new unique assets to your global tracker state
    if (itemsToAdd.length > 0) {
        allImageUrls = [...allImageUrls, ...itemsToAdd];
    }
}

window.deleteMessage = async function (messageId) {
    if (!messageId) return;
    currentDeletingMessageId = messageId
    try {
        var messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        const batch = writeBatch(db);

        // Delete message from Firebase
        const messageRef = doc(db, "Messages", messageId);
        batch.delete(messageRef);
        // Fetch and delete attachments
        const attachmentsSnapshot = await getDocs(
            query(collection(db, "Attachments"), where("messageId", "==", messageId))
        );
        const attachments = attachmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        await Promise.all(attachments.map(async (attachment) => {
            batch.delete(doc(db, "Attachments", attachment.id));
            await fetch(`/api/files/delete?fileName=${encodeURIComponent(attachment.fileName)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });
        }));
        await batch.commit();
        // Remove message from DOM
        if (messageElement) {
            removeMessageAttachmentsFromGlobal(messageId);
            messageElement.remove();
        }

        console.log("✅ Message and attachments deleted successfully");
    } catch (error) {
        console.error("❌ Error deleting message:", error);
    }
};

async function deleteDocumentsWithWhere() {
    // 1. Create your query using 'where'
    // const q = query(
    //     collection(db, "Attachments"),
    //     where("senderId", "not-in", [1, 2])
    // );

    const q = query(
        collection(db, "Messages"),
        where("messageId", "not-in", ["0PUm8uJiwKYtW5qoVFth"])
    );


    // 2. Fetch the documents matching the query
    const querySnapshot = await getDocs(q);

    // 3. Initialize a write batch
    const batch = writeBatch(db);

    querySnapshot.forEach((doc) => {
        // Add each document's deletion reference to the batch
        batch.delete(doc.ref);
    });

    // 4. Commit the batch to execute the deletions
    await batch.commit();
    console.log("Documents successfully deleted!");
}


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
        const topicPath = '/topic/notifications/' + roomId;

        // Pass the topicPath as the custom ID in the headers object (the 2nd argument)
        stompClient.subscribe(topicPath, function (notification) {
            console.log('Received notification:', notification);
            showNotificationToast(notification.body, "success", "short-noty");
        }, { id: topicPath }); // <--- THIS IS THE FIX

    } else {
        console.warn('No roomId found in localStorage');
    }
}

function showNotificationToast(message, type, duration) {
    injectDynamicNotification(message, type, duration);
}

// Function to handle offline state
function handleOffline() {
    showNotificationToast("You are currently offline. Please check your internet connection", "error", "short-noty");
}

// Add a variable to track if the chat is loading
let isChatLoading = false;
const loadingChatClass = 'loading-chat-notification'; // CSS class for loading notification

// Function to show the "Loading Chat" notification
function showLoadingChatNotification(text) {
 if (isChatLoading) return; // Prevent multiple notifications
 isChatLoading = true;
 showLoadingNotificationToast(text + ' chat <span class="loading-indicator"></span>', true, loadingChatClass);
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
 const sidebar = document.querySelector('.sidebar');

 if (chatMessages && notification) {
   const chatRect = chatMessages.getBoundingClientRect();
   const notificationWidth = notification.offsetWidth;
   const notificationHeight = notification.offsetHeight;

   // Calculate the sidebar width (if it exists)
   const sidebarWidth = sidebar ? sidebar.offsetWidth : 0;

   const top = 70; // Account for scrolling
   const left = chatRect.left + (chatRect.width / 2) - (notificationWidth / 2) + (sidebarWidth / 2) - 70;

   notification.style.position = 'absolute';
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

    showNotificationToast("You are back online", "success", "short-noty");
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
    // deleteDocumentsWithWhere();
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

let currentOpenPicker = null; // Global variable to track the currently open picker

const createReactionFeature = (messageWrapper, messageData) => {
    const messageContent = messageWrapper.querySelector(".message-content");

    // Reaction button (visible on hover)
    const reactionBtn = document.createElement("div");
    reactionBtn.classList.add("reaction-btn");
    reactionBtn.innerHTML = "😊"; // Smiley icon

    let isPickerOpen = false; // Track if picker is open

    // Reaction picker (hidden initially)
    const reactionPicker = document.createElement("div");
    reactionPicker.classList.add("reaction-picker", messageWrapper.classList.contains("current-user") ? "reaction-picker-right" : "reaction-picker-left");
    const reactions = ["👍", "👌", "🤙", "🙏", "✍️", "✅", "❌", "🎉", "🤩", "😂", "😄", "😁", "😊", "🥰", "🤗", "🫡", "😮‍💨", "🥳", "😭", "🙆", "💯", "❤️"];
    reactions.forEach(reaction => {
        const emoji = document.createElement("span");
        emoji.textContent = reaction;
        emoji.onclick = async () => {
            currentOpenPicker.style.display = "none";
            isPickerOpen = false; // Ensure picker is closed when clicked outside
            currentOpenPicker = null; // Reset the global variable
            await addReactionToMessage(messageData.messageId, reaction);
            currentEditingMessageId = messageData.messageId;
            renderReactions(messageWrapper, messageData.messageId);
        };
        reactionPicker.appendChild(emoji);
    });

    // Reaction display container
    const reactionDisplay = document.createElement("div");
    reactionDisplay.classList.add("reaction-display", messageWrapper.classList.contains("current-user") ? "reaction-display-right" : "reaction-display-left");

    messageContent.appendChild(reactionBtn);
    messageContent.appendChild(reactionPicker);
    messageContent.appendChild(reactionDisplay);


    // Show/hide reaction picker on click
    reactionBtn.onclick = (event) => {
        // If there is already an open picker, close it
        if (currentOpenPicker && currentOpenPicker !== reactionPicker) {
            currentOpenPicker.style.display = "none";
            isPickerOpen = false;
        }

        // Toggle the current picker
        isPickerOpen = !isPickerOpen;
        reactionPicker.style.display = isPickerOpen ? "flex" : "none";

        // Update the global variable to track the currently open picker
        currentOpenPicker = isPickerOpen ? reactionPicker : null;

        // Prevent click event from propagating to document click handler
        event.stopPropagation();
    };

    // Close the reaction picker if the user clicks anywhere outside of it
    document.onclick = (event) => {
        // If the click was outside of the current picker and button
        if (currentOpenPicker) {
            currentOpenPicker.style.display = "none";
            isPickerOpen = false; // Ensure picker is closed when clicked outside
            currentOpenPicker = null; // Reset the global variable
        }
    };

    // Render existing reactions
    renderReactions(messageWrapper, messageData.messageId);
};

const addReactionToMessage = async (messageId, reaction) => {
    const currentUserId = await fetchCurrentUserId(); // Get the user ID
    if (!currentUserId) {
        console.error("User ID could not be fetched.");
        return;
    }

    try {
        // Fetch username using the user ID
        const usernameResponse = await fetch(`api/users/getUsername?id=${currentUserId}`);
        if (!usernameResponse.ok) {
            throw new Error('getUserName response was not ok');
        }
        const username = await usernameResponse.text();

        const messageRef = doc(db, "Messages", messageId);

        await runTransaction(db, async (transaction) => {
            const messageDoc = await transaction.get(messageRef);
            if (!messageDoc.exists()) return;

            let reactions = messageDoc.data().reactions || {};

            // Ensure reactions are stored as an object
            if (Array.isArray(reactions)) {
                reactions = {};
            }

            // If the reaction doesn't exist, create an empty array
            if (!reactions[reaction]) {
                reactions[reaction] = [];
            }

            // Toggle reaction: Remove if already present, otherwise add
            if (reactions[reaction].includes(username)) {
                reactions[reaction] = reactions[reaction].filter(user => user !== username);
                if (reactions[reaction].length === 0) {
                    delete reactions[reaction]; // Remove empty reactions
                }
            } else {
                reactions[reaction].push(username);
            }

            transaction.update(messageRef, { edited: 1, editRenderedOn: [], reactions });
        });
    } catch (error) {
        console.error("Error adding reaction:", error);
    }
};


const renderReactions = async (messageWrapper, messageId) => {
    const messageRef = doc(db, "Messages", messageId);
    const messageDoc = await getDoc(messageRef);

    if (messageDoc.exists()) {
        let reactions = messageDoc.data().reactions || {};

//        console.log("🔥 Reactions from Firestore:", reactions);
//        console.log("🧐 Type of reactions:", typeof reactions);
//        console.log("📌 Exact type:", Object.prototype.toString.call(reactions));

        if (typeof reactions !== "object" || reactions === null || Array.isArray(reactions)) {
            console.error("❌ Reactions format is incorrect:", reactions);
            return;
        }

        const reactionDisplay = messageWrapper.querySelector(".reaction-display");

        reactionDisplay.innerHTML = ""; // Clear previous reactions

        // Debug each reaction entry
        Object.entries(reactions).forEach(([reaction, usernames]) => {
//            console.log(`➡️ Processing reaction: "${reaction}" with data:`, usernames);

            if (!Array.isArray(usernames)) {
                console.error(`⚠️ Invalid data format for reaction: "${reaction}"`, usernames);
                return;
            }

            const emojiWrapper = document.createElement("span");
            emojiWrapper.textContent = reaction;

            // Add count if more than 1 person reacted
            if (usernames.length > 1) {
                const countSpan = document.createElement("sup");
                countSpan.classList.add("reaction-count");
                countSpan.textContent = usernames.length;
                emojiWrapper.appendChild(countSpan);
            }

            // Show usernames on hover
            emojiWrapper.title = usernames.join(", ");

            reactionDisplay.appendChild(emojiWrapper);
            // Check if reactionDisplay contains any <span> elements
            if (reactionDisplay.querySelector("span")) {
                reactionDisplay.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
            } else {
                reactionDisplay.style.backgroundColor = "transparent"; // Reset if empty
            }
        });
    }
};


const clearReactionsForAllMessages = async () => {
    const messagesRef = collection(db, "Messages");
    try {
        const querySnapshot = await getDocs(messagesRef);

        const batch = writeBatch(db); // Use batch for efficiency

        querySnapshot.forEach((doc) => {
            const messageRef = doc.ref;
            batch.update(messageRef, { reactions: {} }); // Reset reactions
        });

        await batch.commit(); // Execute all updates at once
        console.log("✅ Cleared reactions for all messages in Firestore.");
    } catch (error) {
        console.error("❌ Error clearing reactions for all messages:", error);
    }
};


// Fetch usernames from API
const getUserNames = async (emails) => {
    if (!Array.isArray(emails)) {
        console.error("Emails is not an array:", emails);
        return [];
    }

    const usernamePromises = emails.map(async (email) => {
        try {
            const response = await fetch(`api/users/getUserNameByEmail?email=${email}`);
            if (!response.ok) throw new Error('getUserNameByEmail response was not ok');
            return await response.text();
        } catch (error) {
            console.error(`Failed to fetch username for ${email}:`, error);
            return "Unknown";
        }
    });

    return await Promise.all(usernamePromises);
};

// Mock function to get logged-in user email
const getCurrentUserEmail = () => {
    return "user1@example.com"; // Replace with actual authentication logic
};


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

        if (messagesContainer.getAttribute("data-room-id") !== roomId) {
            messagesContainer.setAttribute("data-room-id", roomId);
            console.log(`Room ID attribute updated to: ${roomId}`);
        }

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
            if (messageDoc.exists()) {
                lastMessageTimestamp = messageDoc.data().timestamp;
            }
        }

        // Helper function to create reply preview
        const createReplyPreview = async (messageData, messageContent) => {
            if (messageData.replyTo) {
                const replyPreview = document.createElement("div");
                replyPreview.classList.add("message-reply-reference");
                replyPreview.dataset.originalMessageId = messageData.replyTo.messageId;
                // Fetch the reply message data from Firestore
                const replyMessageRef = doc(db, "Messages", messageData.replyTo.messageId);
                const replyMessageDoc = await getDoc(replyMessageRef);

                if (replyMessageDoc.exists()) {
                    const replyIndicator = document.createElement("div");
                    replyIndicator.classList.add("reply-indicator");
                    replyIndicator.innerHTML = "↩";
                    replyPreview.appendChild(replyIndicator);

                    const replyData = replyMessageDoc.data();

                    // Add text content if it exists
                    if (replyData.text) {
                        const textElement = document.createElement("span");
                        textElement.innerHTML = replyData.text;
                        replyPreview.appendChild(textElement);
                    }

                    // Fetch and add attachments if they exist
                    const attachments = await fetchAttachmentsForMessages([messageData.replyTo.messageId]);
                    if (attachments[messageData.replyTo.messageId]) {
                        renderAttachments(attachments[messageData.replyTo.messageId], replyPreview, roomId);
                    }
                }
                // Insert reply preview at the beginning of message content
                messageContent.insertBefore(replyPreview, messageContent.firstChild);

                replyPreview.onclick = function () {
                    const originalMessageId = this.getAttribute("data-original-message-id");
                    if (!originalMessageId) return;

                    const targetMessage = document.querySelector(`.message-wrapper[data-message-id="${originalMessageId}"]`);
                    if (!targetMessage) return;

                    const messageContainer = document.querySelector(".message-container");
                    if (messageContainer) {
                        messageContainer.scrollTo({
                            top: targetMessage.offsetTop - messageContainer.offsetTop - 12,
                            behavior: "smooth"
                        });
                    }

                    // Optional: Highlight the target message
                    targetMessage.classList.add("highlight-message");
                    setTimeout(() => targetMessage.classList.remove("highlight-message"), 1500);
                };

            }
            // Add reply preview if it exists
        };

        if (sessionStorage.getItem("newChat") == "true") {
            showLoadingChatNotification("Loading");
            // Clear any pending calls to displayMessages
            if (displayMessagesTimeout) {
                clearTimeout(displayMessagesTimeout);
            }

            // Set a new timeout
            displayMessagesTimeout = setTimeout(async () => {
                console.log("displaying messages");
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

                    // **1. Extract Message IDs**
                    const messageIds = messages.map(message => message.messageId);

                    // **2. Fetch All Attachments in ONE Query**
                    const attachmentsByMessageId = await fetchAttachmentsForMessages(messageIds);

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

                        // Add reply preview if exists
                        await createReplyPreview(data, messageContent);

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
                            <div class="action-item ${messageWrapper.classList.contains('current-user') ? '' : 'd-none'}"
                                 data-action="edit"
                                 onclick="editMessage('${data.messageId}')">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12 20h9"></path>
                                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                                </svg>
                                Edit
                            </div>
                            <div class="action-item" data-action="copy">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                                Copy Text
                            </div>
                            <div class="action-item" data-action="reply" onclick="messageReply('${data.messageId}')">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"></path>
                                </svg>
                                Reply
                            </div>
                            <div class="action-item delete-chat" data-action="delete" onclick="deleteMessage('${data.messageId}')">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M3 6h18"></path>
                                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    <path d="M10 11v6"></path>
                                    <path d="M14 11v6"></path>
                                    <path d="M5 6h14l-1 14H6Z"></path>
                                </svg>
                                Delete
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
                        textElement.innerHTML = data.text;
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
                        // 3. Render Attachments for this Message
                        renderAttachments(attachmentsByMessageId[data.messageId] || [], messageContent, roomId);
                        messagesContainer.appendChild(messageWrapper);
                        createReactionFeature(messageWrapper, data);
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
                resolve();
                sessionStorage.setItem("newChat", "false");
            }, 300);
        } else {
            let lastDisplayedDate = null;
            let lastMessageTimestamp = null;

            // Get the last message ID from the DOM
            const messageWrappers = messagesContainer.querySelectorAll(".message-wrapper");
            const lastMessageWrapper = messageWrappers[messageWrappers.length - 1] || null;

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
                messagesQuery = query(messagesQuery, where("timestamp", ">=", Timestamp.fromMillis(lastMessageTimestamp.seconds * 1000 + lastMessageTimestamp.nanoseconds / 1e6)));
            }

            const newSnapshot = await getDocs(messagesQuery);

            // **1. Extract Message IDs for the new messages**
            const newMessageIds = newSnapshot.docs
              .map(doc => doc.data().messageId)
              .filter(Boolean);
            // **2. Fetch All Attachments for the new messages**
            const attachmentsByMessageId = await fetchAttachmentsForMessages(newMessageIds);

            // Construct the Firestore query
            let editedMessagesQuery = query(
              collection(db, "Messages"),
              where("roomId", "==", localStorage.getItem("roomId")),
              where("edited", "==", 1), // Separate condition
              orderBy("timestamp", "asc")
            );

            const newEditedSnapshot = await getDocs(editedMessagesQuery);

            // **1. Extract Message IDs for the new messages**
            const newEditedMessageIds = newEditedSnapshot.docs
              .map(doc => doc.data().messageId)
              .filter(Boolean);
            // **2. Fetch All Attachments for the new messages**
            const editedAttachmentsByMessageId = await fetchAttachmentsForMessages(newEditedMessageIds);
            if(newEditedSnapshot.docs.length > 0){
                // Process all new messages from the snapshot
                for (const change of newEditedSnapshot.docs) {
                    const data = change.data();
                    const messageId = data.messageId;
                    const isCurrentUser = data.senderId === currentUserId;

                    // Check if this is an edited message by looking for the edited flag
                    // This is an edited message, find the existing message in the DOM
                    const existingMessageElement = document.querySelector(`.message-wrapper[data-message-id="${messageId}"]`);

                    if (existingMessageElement) {
                        // Update the text content
                        const textSpan = existingMessageElement.querySelector('.message-content span:not(.message-reply-reference > span)');
                        const messageContent = existingMessageElement.querySelector('.message-content');
                        if (messageContent) {
                            // Add edited indicator if it doesn't exist
                            if (!messageContent.querySelector('.edited-indicator')) {
                                const editedIndicator = document.createElement('small');
                                editedIndicator.classList.add('edited-indicator');
                                editedIndicator.textContent = ' (edited)';
                                editedIndicator.style.opacity = '0.7';
                                messageContent.querySelector('.reaction-display').style.marginTop = '32px';
                                messageContent.appendChild(editedIndicator);
                            }
                        }

                        // update message content -
                        textSpan.innerHTML = data.text;
                        // Update attachments
                        // Remove existing attachments container if it exists
                        const existingAttachmentsContainer = messageContent.querySelector('.attachments-container');
                        if (existingAttachmentsContainer) {
                            existingAttachmentsContainer.remove();
                        }
                        // Re-render the attachments
                        renderAttachments(editedAttachmentsByMessageId[messageId] || [], messageContent, localStorage.getItem("roomId"));

                        // Reset the edited flag in Firestore
                        const messageRef = doc(db, "Messages", messageId);
                        const roomId = localStorage.getItem("roomId");
                        const roomRef = doc(db, "Rooms", roomId);
                        const roomDocSnap = await getDoc(roomRef);
                        const roomData = roomDocSnap.data();
                        const usersIds = roomData.userIds;
                        renderReactions(existingMessageElement, messageId);
                        if(usersIds.every(userId => data.editRenderedOn.includes(userId))){
                            await updateDoc(messageRef, { edited: 0 });
                        }
                        else{
                            const currentUserId = await fetchCurrentUserId();
                            await updateDoc(messageRef, { editRenderedOn: arrayUnion(currentUserId) });
                        }
                    }
                }
            }
            else{
                // Process all messages from the snapshot
                for (const change of newSnapshot.docs) {
                  const data = change.data();
                  const messageId = data.messageId;
                  const isCurrentUser = data.senderId === currentUserId;

                  const existingMessageElement = document.querySelector(`.message-wrapper[data-message-id="${messageId}"]`);

                  if (!existingMessageElement) {
                      // If we reach here, this is a new message or the message wasn't found in the DOM
                      // Create new message element
                      const messageWrapper = document.createElement("div");
                      messageWrapper.classList.add("message-wrapper", isCurrentUser ? "current-user" : "other-user");
                      messageWrapper.setAttribute("data-message-id", messageId);

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

                      // Add reply preview if exists
                      await createReplyPreview(data, messageContent);

                      const textElement = document.createElement("span");
                      textElement.innerHTML = data.text;

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
                          <div class="action-item ${messageWrapper.classList.contains('current-user') ? '' : 'd-none'}"
                               data-action="edit"
                               onclick="editMessage('${data.messageId}')">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                  <path d="M12 20h9"></path>
                                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                              </svg>
                              Edit
                          </div>
                          <div class="action-item" data-action="copy">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                              </svg>
                              Copy Text
                          </div>
                          <div class="action-item" data-action="reply" onclick="messageReply('${data.messageId}')">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                  <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"></path>
                              </svg>
                              Reply
                          </div>
                          <div class="action-item delete-chat" data-action="delete" onclick="deleteMessage('${data.messageId}')">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                  <path d="M3 6h18"></path>
                                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  <path d="M10 11v6"></path>
                                  <path d="M14 11v6"></path>
                                  <path d="M5 6h14l-1 14H6Z"></path>
                              </svg>
                              Delete
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
                      // 3. Render Attachments for this Message
                      renderAttachments(attachmentsByMessageId[data.messageId] || [], messageContent, roomId); // Pass the attachments for this message
                      messagesContainer.appendChild(messageWrapper);
                      createReactionFeature(messageWrapper, data);
                  }
                }
            }
            resolve();
        }
    });
}

async function fetchAttachmentsForMessages(messageIds) {
    const MAX_IN_CLAUSE_SIZE = 30; // Firestore limit for 'in' operator
    const attachmentsByMessageId = {};

    // Function to process a batch of message IDs
    async function processBatch(batchIds) {
        if (batchIds.length === 0) return;
        const attachmentsQuery = query(
            collection(db, "Attachments"),
            where("messageId", "in", batchIds)
        );

        const attachmentsSnapshot = await getDocs(attachmentsQuery);

        attachmentsSnapshot.forEach(doc => {
            const attachment = doc.data();
            const messageId = attachment.messageId;
            if (!attachmentsByMessageId[messageId]) {
                attachmentsByMessageId[messageId] = [];
            }
            attachmentsByMessageId[messageId].push(attachment);
        });
    }

    // Split messageIds into batches of MAX_IN_CLAUSE_SIZE
    for (let i = 0; i < messageIds.length; i += MAX_IN_CLAUSE_SIZE) {
        const batchIds = messageIds.slice(i, i + MAX_IN_CLAUSE_SIZE);
        await processBatch(batchIds); // Await the completion of each batch
    }

    return attachmentsByMessageId;
}

function renderAttachments(attachments, messageContent,messageRoomId) {
    // Remove existing attachments container if it exists
    const existingAttachments = messageContent.querySelector(".attachments-container");
    if (existingAttachments) {
        existingAttachments.remove();
    }

    if (!attachments || attachments.length === 0) {
        return;
    }

    const AttachmentsBox = document.createElement("div");
    AttachmentsBox.classList.add("attachments-container");
    const messageWrapper = messageContent.closest('.message-wrapper');

    // Store all images from all message contents globally
    attachments.forEach(attachment => {
        console.log(attachment);
        console.log(attachment.fileType);
        if (attachment.fileType.startsWith('image/')) {
            const imgWrapper = document.createElement('div');
            imgWrapper.classList.add('image-wrapper');

            const imgElement = document.createElement('img');
            imgElement.src = attachment.downloadUrl;
            imgElement.classList.add('message-image');
            imgElement.alt = "Preview Image";

            const hoverText = document.createElement('span');
            hoverText.classList.add('image-hover-text');
            hoverText.textContent = "Preview Image";

            hoverText.onclick = () => openImagePreview(attachment.downloadUrl);
            imgElement.onclick = () => openImagePreview(attachment.downloadUrl);

            imgWrapper.appendChild(imgElement);
            imgWrapper.appendChild(hoverText);
            AttachmentsBox.appendChild(imgWrapper);
            // Check if this specific URL is already tracked inside the current room context
            const isDuplicate = allImageUrls.some(item => item.roomId === messageRoomId && item.url === attachment.downloadUrl);

            if (!isDuplicate) {
                allImageUrls.push({
                    roomId: messageRoomId,
                    url: attachment.downloadUrl
                });
            }
        } else {
            const fileLink = document.createElement('a');
            fileLink.href = attachment.downloadUrl;
            fileLink.textContent = attachment.fileName;
            fileLink.download = attachment.fileName;
            fileLink.classList.add('message-file-link');
            AttachmentsBox.appendChild(fileLink);
        }
    });
    const reactionDisplay = messageContent.querySelector(".reaction-display");
    if (reactionDisplay) {
        messageContent.insertBefore(AttachmentsBox, reactionDisplay);
    } else {
//        console.log("No .reaction-display found! Appending attachment at the end.");
        messageContent.appendChild(AttachmentsBox);
    }
    if (messageWrapper) {
        const messageId = messageWrapper.getAttribute('data-message-id'); // Get message ID

        // Find the `message-actions-btn` div
        const actionsMenu = messageContent.querySelector('.message-actions-menu');

        if (actionsMenu) {
            const existingActionItem = actionsMenu.querySelector('.action-item[data-action="download"]');

            if (!existingActionItem) {
                // Append the new action item if it doesn't exist
                actionsMenu.innerHTML += `
                    <div class="action-item" data-action="download" onclick="downloadFile('${messageId}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Download Attachments
                    </div>
                `;
            }
        }

    }
}


// Global list to store all images from all messages along with their room context
// Structure: [{ roomId: "room_123", url: "https://..." }, ...]
let allImageUrls = [];

// Open Image Preview Modal
function openImagePreview(currentImageUrl) {
    // 1. Get the current active room ID
    const currentRoomId = localStorage.getItem('roomId');

    // 2. Filter the global array to get ONLY the images belonging to this room
    const currentRoomImages = allImageUrls
        .filter(item => item.roomId === currentRoomId)
        .map(item => item.url);

    // 3. Find the index within this filtered room-specific array
    let currentIndex = currentRoomImages.indexOf(currentImageUrl);

    // Fallback safeguard: If for some reason the image isn't tracked yet, show it standalone
    if (currentIndex === -1 && currentImageUrl) {
        currentRoomImages.push(currentImageUrl);
        currentIndex = currentRoomImages.length - 1;
    }

    const modal = document.createElement('div');
    modal.classList.add('image-preview-modal');
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <span class="close-btn">&times;</span>
            <button class="prev-btn">&langle;</button>
            <img src="${currentRoomImages[currentIndex] || ''}" class="modal-image">
            <button class="next-btn">&rangle;</button>
        </div>
    `;

    document.body.appendChild(modal);

    const modalImage = modal.querySelector('.modal-image');
    const prevBtn = modal.querySelector('.prev-btn');
    const nextBtn = modal.querySelector('.next-btn');

    // Function to show image by index from the room-specific list
    function showImage(index) {
        if (index >= 0 && index < currentRoomImages.length) {
            currentIndex = index;
            modalImage.src = currentRoomImages[currentIndex];
            updateButtons();
        }
    }

    // Update button visibility based on the current room's image count
    function updateButtons() {
        prevBtn.style.display = currentIndex === 0 ? 'none' : 'block';
        nextBtn.style.display = currentIndex === currentRoomImages.length - 1 ? 'none' : 'block';
    }

    prevBtn.onclick = () => showImage(currentIndex - 1);
    nextBtn.onclick = () => showImage(currentIndex + 1);

    updateButtons();

    // Close modal on click
    modal.querySelector('.close-btn').onclick = () => closeModal();
    modal.querySelector('.modal-overlay').onclick = () => closeModal();

    // Close modal & navigate images with keyboard
    document.addEventListener("keydown", handleKeydown);

    function handleKeydown(event) {
        if (event.key === "ArrowLeft") showImage(currentIndex - 1);  // Left arrow key
        if (event.key === "ArrowRight") showImage(currentIndex + 1); // Right arrow key
        if (event.key === "Escape") closeModal(); // Escape key to close modal
    }

    function closeModal() {
        modal.remove();
        document.removeEventListener("keydown", handleKeydown);
    }
}


// Function to fetch rooms where the current user is a member
async function fetchCurrentUserRooms() {
  const currentUserId = await fetchCurrentUserId();
  const roomsRef = collection(db, "Rooms");
  const roomsQuery = query(roomsRef, where("userIds", "array-contains", currentUserId));
  const roomsSnapshot = await getDocs(roomsQuery);
  const currentUserRooms = roomsSnapshot.docs.map(doc => doc.id);
  return currentUserRooms;
}

function playNotificationSound() {
    try {
        const audio = new Audio('/sounds/new-message.mp3');

        // No explicit lower volume caps set here.
        // It respects whatever master volume level the user's device is outputting.
        audio.play();
    } catch (error) {
        console.warn("Failed to play notification sound:", error);
    }
}

// A global Set to track room IDs that already have an active Firestore listener
const activeNotificationListeners = new Set();
// Global cache mapping: roomId -> "Other User's Name"
const oneToOneRoomNamesCache = new Map();

async function initializeBackgroundNotificationListeners() {
    const currentUserRooms = await fetchCurrentUserRooms();
    const currentUserId = await fetchCurrentUserId();

    // 1. Pre-fetch and cache names for all 1-to-1 rooms first
    for (const rId of currentUserRooms) {
        if (activeNotificationListeners.has(rId)) continue;

        const roomRef = doc(db, "Rooms", rId);
        const roomDoc = await getDoc(roomRef);

        if (roomDoc.exists()) {
            const roomData = roomDoc.data();

            // If name is blank or missing, it's a 1-to-1 room
            if (!roomData.name || roomData.name.trim() === "") {
                const userIds = roomData.userIds || [];

                // Eliminate the current logged-in user to find the recipient's ID
                const otherUserId = userIds.find(id => String(id) !== String(currentUserId));

                if (otherUserId) {
                    try {
                        // Fetch the actual name from your database/API once
                        const response = await fetch(`/api/users/getUsername?id=${Number(otherUserId)}`);
                        if (!response.ok) throw new Error("Failed to fetch username");
                        const otherUserName = await response.text();
                        oneToOneRoomNamesCache.set(rId, otherUserName);
                    } catch (err) {
                        console.error(`Failed to fetch user name for ID ${otherUserId}:`, err);
                        oneToOneRoomNamesCache.set(rId, "Someone"); // Fallback text
                    }
                }
            }
        }
    }

    // 2. Setup listeners as usual
    currentUserRooms.forEach((rId) => {
        if (activeNotificationListeners.has(rId)) return;
        activeNotificationListeners.add(rId);

        const messagesQueryForNewMessages = query(
            collection(db, "Messages"),
            where("roomId", "==", rId),
            orderBy("timestamp", "asc")
        );

        // Persistent background snapshot listener
        onSnapshot(messagesQueryForNewMessages, async (snapshot) => {
            const roomRef = doc(db, "Rooms", rId);
            try {
                const roomDoc = await getDoc(roomRef);
                if (!roomDoc.exists()) return;

                const roomData = roomDoc.data();
                let notificationText = "";

                // Determine Notification String Structure
                if (roomData.name && roomData.name.trim() !== "") {
                    // Group Chat Rule
                    notificationText = `New messages in ${roomData.name}`;
                } else {
                    // 1-to-1 Chat Rule: Instantly grab the name out of memory cache
                    const senderName = oneToOneRoomNamesCache.get(rId) || "Someone";
                    notificationText = `New messages from ${senderName}`;
                }

                let lastReadMessageId = roomData.lastReadMessageId || {};
                const currentUserLastReadMessageId = lastReadMessageId[currentUserId];

                const latestMessage = snapshot.docs[snapshot.docs.length - 1];
                let latestMessageId = latestMessage ? latestMessage.id : null;

                if (latestMessageId != null && currentUserLastReadMessageId !== latestMessageId) {
                    const latestMessageData = latestMessage.data();
                    const readyByUsers = latestMessageData.readyByUsers || [];

                    if (!readyByUsers.includes(currentUserId)) {
                        if (localStorage.getItem("roomId") !== rId) {
                            showNotificationToast(notificationText,"success", "short-noty");
                            playNotificationSound();
                        }
                    }
                }
            } catch (error) {
                console.error("Error checking new messages:", error);
            }
        });
    });
}

let globalActiveChatListener = null;
let globalMutationObserver = null;

async function openChat(roomId) {
    // 1. Manage WebSocket Swap (Top of function)
    if (stompClient && stompClient.connected) {
        const oldRoomId = localStorage.getItem("roomId");
        if (oldRoomId) {
            stompClient.unsubscribe('/topic/notifications/' + oldRoomId);
        }
    }

    // 2. Clear ONLY the main active chat view listener
    if (globalActiveChatListener) {
        globalActiveChatListener();
        globalActiveChatListener = null;
    }
    if (globalMutationObserver) {
        globalMutationObserver.disconnect();
    }

    // 3. Set up new room state
    console.log(`Opening chat for room ID: ${roomId}`);
    sessionStorage.setItem("newChat", "true");
    localStorage.setItem("roomId", roomId);

    if (stompClient && stompClient.connected) {
        subscribeToNotifications();
    }

    // 4. Setup DOM Scroll Observer
    const messagesContainer = document.getElementById("messages");
    globalMutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE &&
                    node.tagName === 'DIV' && currentEditingMessageId == null && currentDeletingMessageId == null) {
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
                currentDeletingMessageId = null;
            });
        });
    });
    globalMutationObserver.observe(messagesContainer, { childList: true, subtree: true });

    // 5. Define a tracking flag for the initial data payload
    let isInitialLoad = true;

    // 6. Active Chat Screen Firestore Listener
    const messagesQuery = query(
        collection(db, "Messages"),
        where("roomId", "==", roomId),
        orderBy("timestamp", "asc")
    );

    globalActiveChatListener = onSnapshot(messagesQuery, async (snapshot) => {
        try {
            // Step A: Always await the message populating/rendering logic first
            await handleNewMessages(snapshot, roomId);

            // Step B: Check if this is the absolute first time the room is loading data
            if (isInitialLoad) {
                console.log(`Initial message render complete for room ${roomId}. Marking as read once.`);

                await markMessagesAsRead(roomId); // Await it here to guarantee sequential execution
                isInitialLoad = false;            // Flip the flag so this block NEVER runs again
            }
        } catch (error) {
            console.error("Error processing messages snapshot:", error);
        } finally {
            hideLoadingChatNotification();
        }
    });

    // 7. Independent synchronous UI updates can stay here
    displayReadByUsersFromRooms(roomId);

    // 8. If a user is added to a new room during their session,
    // this keeps our background listeners up to date without duplicating existing ones.
    initializeBackgroundNotificationListeners();
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-analytics.js";
import { runTransaction, arrayUnion, writeBatch, getFirestore, collection, getDocs, getDoc, deleteDoc, doc, addDoc, query, orderBy, where, limit, onSnapshot, updateDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA7bzHTKqFCMSzZfgNYWUC7Nf_RjJk_ALQ",
  authDomain: "wechat-ec503.firebaseapp.com",
  projectId: "wechat-ec503",
  storageBucket: "wechat-ec503.firebasestorage.app",
  messagingSenderId: "416052037332",
  appId: "1:416052037332:web:c1880edd4030a59aa51d41",
  measurementId: "G-6HPJM7WKSM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const db = getFirestore(app);


function showAttachmentLimitNotification() {
    // Check if a notification is already present
    let existingNotification = document.querySelector('.attachment-limit-notification');
    if (existingNotification) return; // Prevent duplicate notifications

    const notification = document.createElement("div");
    notification.classList.add("attachment-limit-notification");
    notification.textContent = "You can only attach up to 5 files at a time !";

    document.body.appendChild(notification);

    // Get viewport width and height
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate position dynamically
    const notificationWidth = notification.offsetWidth;
    const notificationHeight = notification.offsetHeight;

    const left = (viewportWidth / 2);
    const top = (viewportHeight * 0.12); // 10% from the top
    notification.style.position = 'absolute';
    notification.style.left = `${left}px`;
    notification.style.top = `${top}px`;

    // Auto-remove the notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}


// Function to send a message
async function sendMessage(roomId) {
    if(currentReplyMessageId != null || (currentReplyMessageId == null && currentEditingMessageId == null)){
        const messageContentInput = document.getElementById("message-content");
            const trixEditor = document.querySelector("trix-editor");

            if (!messageContentInput) {
                console.error("message-content element not found in the DOM.");
                return;
            }
            let messageText = messageContentInput.value;

            // Attachment Handling
            const attachments = trixEditor.editor.getDocument().getAttachments();
            const fileAttachments = attachments.filter(attachment => attachment.file);
            // Show error notification if more than 4 attachments
            if (fileAttachments.length > 5) {
                showAttachmentLimitNotification();
                return;
            }
            if (!messageText && fileAttachments.length === 0) return;
            // Clear editor and input
            trixEditor.editor.loadHTML("");
            messageContentInput.value = "";
            const messagesContainer = document.getElementById("messages");

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

                const messageRef = doc(collection(db, "Messages"));
                const messageId = messageRef.id;

                // Create message data with reply information if exists
                const messageData = {
                    roomId: roomId,
                    senderId: senderId,
                    text: messageText,
                    timestamp: new Date(),
                    messageId: messageId,
                    replyTo: currentReplyMessageId ? {
                        messageId: currentReplyMessageId,
                        timestamp: new Date()
                    } : null
                };

                const batch = writeBatch(db);
                batch.set(messageRef, messageData);

                // Upload Attachments to Backend
                if (fileAttachments.length > 0) {
                    await Promise.all(
                        fileAttachments.map(async (attachment, index) => {
                            const file = attachment.file;

                            try {
                                const formData = new FormData();
                                formData.append('file', file);

                                const response = await fetch('/api/files/upload', {
                                    method: 'POST',
                                    body: formData
                                });

                                if (!response.ok) {
                                    console.error("Error uploading to backend:", response.status, response.statusText);
                                    throw new Error(`HTTP error! Status: ${response.status}`);
                                }

                                const downloadUrl = await response.text();

                                const attachmentData = {
                                    messageId: messageId,
                                    senderId: senderId,
                                    fileName: file.name,
                                    fileSize: file.size,
                                    fileType: file.type,
                                    downloadUrl: downloadUrl,
                                    timestamp: new Date()
                                };

                                const attachmentRef = doc(collection(db, "Attachments"));
                                batch.set(attachmentRef, attachmentData);

                            } catch (uploadError) {
                                console.error("Error uploading to backend:", uploadError);
                            }
                        })
                    );
                }

                 // Create message element
                const messageElement = document.createElement("div");
                const isCurrentUser = true;

                const messageWrapper = document.createElement("div");
                messageWrapper.classList.add("message-wrapper", isCurrentUser ? "current-user" : "other-user");
                messageWrapper.setAttribute("data-message-id", messageData.messageId);

                // Add metadata div
                const hiddenDataDiv = document.createElement("div");
                hiddenDataDiv.classList.add("message-metadata");
                hiddenDataDiv.style.display = "none";
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

                const actionsMenu = document.createElement("div");
                actionsMenu.classList.add("message-actions-menu");
                actionsMenu.innerHTML = `
                    <div class="action-item ${messageWrapper.classList.contains('current-user') ? '' : 'd-none'}"
                         data-action="edit"
                         onclick="editMessage('${messageData.messageId}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                        </svg>
                        Edit
                    </div>
                    <div class="action-item" data-action="copy">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        Copy Text
                    </div>
                    <div class="action-item" data-action="reply" onclick="messageReply('${messageData.messageId}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"></path>
                        </svg>
                        Reply
                    </div>
                    <div class="action-item delete-chat" data-action="delete" onclick="deleteMessage('${messageData.messageId}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <path d="M10 11v6"></path>
                            <path d="M14 11v6"></path>
                            <path d="M5 6h14l-1 14H6Z"></path>
                        </svg>
                        Delete
                    </div>
                `;

                // Handle date display
                const messageDate = new Date(messageData.timestamp);
                const options = { hour: 'numeric', minute: 'numeric', hour12: true };

                // Find last date header
                const lastDateHeader = messagesContainer.querySelector('.date-header:last-of-type');
                let lastDisplayedDate = lastDateHeader ? parseDateFromHeader(lastDateHeader.textContent) : null;

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
                textElement.innerHTML = messageData.text;

                // Add reply preview if it exists
                if (messageData.replyTo) {
                    const replyPreview = document.createElement("div");
                    replyPreview.classList.add("message-reply-reference");
                    replyPreview.dataset.originalMessageId = messageData.replyTo?.messageId;
                    const replyMessageWrapper = document.querySelector(`.message-wrapper[data-message-id="${messageData.replyTo?.messageId}"]`);
                    const replyContent = replyMessageWrapper.querySelector(".message-content");
                    if (replyMessageWrapper) {
                            // Extract only the `.attachments-container`, spans
//                            const attachmentsContainer = replyMessageWrapper.querySelector(".attachments-container");
                            const textContent = replyMessageWrapper.querySelector('span:not(.message-reply-reference > span)');

                            const replyIndicator = document.createElement("div");
                            replyIndicator.classList.add("reply-indicator");
                            replyIndicator.innerHTML = "↩";
                            replyPreview.appendChild(replyIndicator);
//                            if (attachmentsContainer) {
//                                replyPreview.appendChild(attachmentsContainer.cloneNode(true));
//                            }
                            if (textContent) {
                                replyPreview.appendChild(textContent.cloneNode(true));
                            }
                        }
                    messageContent.appendChild(replyPreview);
                    replyPreview.onclick = function () {
                        const originalMessageId = this.getAttribute("data-original-message-id");
                        if (!originalMessageId) return;

                        const targetMessage = document.querySelector(`.message-wrapper[data-message-id="${originalMessageId}"]`);
                        if (!targetMessage) return;

                        const messageContainer = document.querySelector(".message-container");
                        if (messageContainer) {
                            messageContainer.scrollTo({
                                top: targetMessage.offsetTop - messageContainer.offsetTop - 12,
                                behavior: "smooth"
                            });
                        }

                        // Optional: Highlight the target message
                        targetMessage.classList.add("highlight-message");
                        setTimeout(() => targetMessage.classList.remove("highlight-message"), 1500);
                    };
                }

                messageContent.appendChild(textElement);
                messageContent.appendChild(actionsButton);
                messageContent.appendChild(actionsMenu);
                messageWrapper.appendChild(messageContent);
               createReactionFeature(messageWrapper, messageData);

                // Render attachments
                if (fileAttachments.length > 0) {
                    const attachmentsData = fileAttachments.map(attachment => ({
                        fileType: attachment.file.type,
                        downloadUrl: URL.createObjectURL(attachment.file),
                        fileName: attachment.file.name
                    }));
                    renderAttachments(attachmentsData, messageContent, roomId);
                }

                messagesContainer.appendChild(messageWrapper);

                // Scroll to bottom and clear reply preview
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                closeReply();

                // Update Firebase
                markMessagesAsRead(localStorage.getItem("roomId"));
                await batch.commit();

                console.log("Document written");
            } catch (e) {
                console.error("Error adding document: ", e);
            }
            currentReplyMessageId = null;
    }
    else{
        showLoadingChatNotification("Loading");
        saveEditedMessage();
    }
}

async function showReadyByImages(roomSnapshot, currentUserId){
    const messagesContainer = document.getElementById("messages");
    if (!messagesContainer || roomSnapshot.data() == undefined) return;
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
    showLoadingChatNotification("Updating");
    const currentUserId = await fetchCurrentUserId();
    if (!currentUserId || currentUserId === -1) return;
    const messagesContainer = document.getElementById("messages");

    if (!messagesContainer) return;

    const lastMessageElement = messagesContainer.querySelector(".message-wrapper:not(:has(~ .message-wrapper))");
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

        // Get all span elements and join their text
        const messageText = messageElement.find('span').map(function() {
            return $(this).html(); // Get text content of each <span>
        }).get().join(' '); // Join all spans into a single string

        switch(action) {
            case 'copy':
                // Find the first div using regex
                const firstDivMatch = messageText.match(/<div>([\s\S]*?)<\/div>/);
                const firstDiv = firstDivMatch ? firstDivMatch[0] : '';
                navigator.clipboard.writeText(firstDiv).then(() => {
                    console.log("Copied to clipboard:", firstDiv);
                }).catch(err => console.error("Copy failed", err));
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
let messageInput = document.getElementById("message-content");
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

document.addEventListener("trix-paste", async function(event) {
  event.preventDefault();
  const editor = document.querySelector("trix-editor").editor;
    // Clear the existing content of the Trix editor
    editor.loadHTML("");

  try {
    const pastedText = await navigator.clipboard.readText();


    // Insert the pasted text as HTML
    editor.insertHTML(pastedText);
  } catch (err) {
    console.error("Failed to read clipboard contents: ", err);
  }
});

document.addEventListener('DOMContentLoaded', function() {
    const toolbar = document.querySelector('trix-toolbar');
    const toolbarToggle = document.createElement('button');
    const editor = document.querySelector('trix-editor');

    toolbarToggle.className = 'btn btn-outline-secondary toolbar-toggle-btn me-2';
    toolbarToggle.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M3 20h5M12 4h9M3 4h5M3 12h18"/></svg>';

    const sendBtnBox = document.querySelector('.send-btn-box');
    sendBtnBox.insertBefore(toolbarToggle, sendBtnBox.firstChild);

    let isToolbarVisible = false;

    toolbarToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        isToolbarVisible = !isToolbarVisible;
        toolbar.classList.toggle('show');
        toolbarToggle.classList.toggle('active');
    });

    // Close toolbar when clicking outside editor and toolbar
    toolbarToggle.addEventListener('click', (e) => {
        if (!editor.contains(e.target) &&
            !toolbar.contains(e.target) &&
            !toolbarToggle.contains(e.target) &&
            isToolbarVisible) {
            isToolbarVisible = false;
            toolbar.classList.remove('show');
            toolbarToggle.classList.remove('active');
        }
    });

    // Prevent event bubbling from toolbar
    toolbar.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Add this JavaScript to handle attachments
    document.addEventListener('trix-file-accept', function(event) {
        // Optional: Limit file types
        const acceptedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        // Optional: Limit file size (e.g., 5MB)
        const maxFileSize = 5 * 1024 * 1024; // 5MB
        if (event.file.size > maxFileSize) {
            event.preventDefault();
            alert('File size must be less than 5MB');
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
  const editor = document.querySelector('trix-editor');
  const sendButton = document.getElementById('sendMessage');

  // Function to send message
  const sendMessage = () => {
    if (editor.value.trim()) {
      sendButton.click();
    }
  };

  // Handle enter key press
  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.altKey && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }

    // Handle Alt+Enter for new line
    if (e.key === 'Enter' && e.altKey) {
      e.preventDefault();
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const br = document.createElement('br');

      // Insert line break at cursor position
      range.insertNode(br);

      // Move cursor after the break
      range.setStartAfter(br);
      range.setEndAfter(br);
      selection.removeAllRanges();
      selection.addRange(range);

      // Scroll content upward
      const editorWrapper = editor.closest('.editor-wrapper');
    }
  });
});