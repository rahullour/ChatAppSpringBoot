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

    @GetMapping("/testFirestore")
    public String testFirestore() {
        // Use the firestore instance to perform operations
        return "Firestore instance is ready!";
    }
}
