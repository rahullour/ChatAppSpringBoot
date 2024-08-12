package com.creating.chatApplication.controller.rest;

import com.creating.chatApplication.entity.UserRoom;
import com.creating.chatApplication.service.UserService;
import com.creating.chatApplication.service.user_room.UserRoomService;
import com.creating.chatApplication.entity.User;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.WriteResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

@RestController
@RequestMapping("/api/firebase")
public class FirebaseController {

    @Autowired
    private Firestore firestore;

    @Autowired
    private UserRoomService userRoomService;

    @Autowired
    private UserService userService;

    private static final String ROOMS_COLLECTION = "rooms";

    @PostMapping("/rooms")
    public String createRoom(@RequestBody Map<String, Object> roomData) throws ExecutionException, InterruptedException {
        String roomId = roomData.get("roomId").toString(); // Extract room ID from request
        ApiFuture<WriteResult> result = firestore.collection(ROOMS_COLLECTION).document(roomId).set(roomData);

        // Insert the user-room relationship into the local database
        // Assuming you have a method to insert into user_room table
        insertUserRoom(roomData.get("userId").toString(), roomId);

        return "Room created with ID: " + roomId + " at " + result.get().getUpdateTime();
    }

    private void insertUserRoom(String userId, String roomId) {
        try {
            // Fetch the User object from the database
            User user = userService.getCurrentUser();
            if (user != null) {
                // Create the UserRoom association
                userRoomService.createUserRoom(user, roomId);
            } else {
                // Handle the case where the user does not exist
                throw new RuntimeException("User not found with ID: " + userId);
            }
        } catch (NumberFormatException e) {
            throw new RuntimeException("Invalid user ID: " + userId, e);
        }
    }


    // Get messages from a specific room
    @GetMapping("/rooms/{roomId}/messages")
    public List<QueryDocumentSnapshot> getMessages(@PathVariable String roomId) throws ExecutionException, InterruptedException {
        CollectionReference messagesRef = firestore.collection(ROOMS_COLLECTION).document(roomId).collection("messages");
        return messagesRef.get().get().getDocuments();
    }

    // Send a message to a specific room
    @PostMapping("/rooms/{roomId}/messages")
    public String sendMessage(@PathVariable String roomId, @RequestBody Map<String, Object> messageData) throws ExecutionException, InterruptedException {
        CollectionReference messagesRef = firestore.collection(ROOMS_COLLECTION).document(roomId).collection("messages");
        String messageId = messagesRef.document().getId(); // Generate a new message ID
        messageData.put("messageId", messageId); // Add the message ID to the data
        ApiFuture<WriteResult> result = messagesRef.document(messageId).set(messageData);
        return "Message sent with ID: " + messageId + " at " + result.get().getUpdateTime();
    }

    // Create a user-room relationship
    @PostMapping("/user_room")
    public String createUserRoom(@RequestBody Map<String, String> userRoomData) throws ExecutionException, InterruptedException {
        String userId = userRoomData.get("userId");
        String roomId = userRoomData.get("roomId");

        // Here, you could store the user-room relationship in a separate collection
        // or as a subcollection under the user document
        Map<String, String> userRoom = new HashMap<>();
        userRoom.put("userId", userId);
        userRoom.put("roomId", roomId);

        ApiFuture<WriteResult> result = firestore.collection("user_room").document(userId + "_" + roomId).set(userRoom);
        return "User-Room relationship created for User ID: " + userId + " and Room ID: " + roomId;
    }
}
