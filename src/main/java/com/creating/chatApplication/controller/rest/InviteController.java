package com.creating.chatApplication.controller.rest;

import com.creating.chatApplication.service.EmailService;
import com.creating.chatApplication.service.InviteService;
import com.creating.chatApplication.service.NotificationManager;
import com.creating.chatApplication.service.UserService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api")
public class InviteController {

    @Autowired
    private NotificationManager notificationManager;

    @Autowired
    private EmailService emailService;

    @Autowired
    private UserService userService;

    @Autowired
    private InviteService inviteService;

    @PostMapping("/invites")
    public ResponseEntity<Void> sendInvite(@RequestParam String senderEmail, @RequestParam String emails) {
        // Parse the JSON string back to a List
        ObjectMapper objectMapper = new ObjectMapper();
        List<String> recieverEmails;
        try {
            recieverEmails = objectMapper.readValue(emails, new TypeReference<List<String>>() {});
        } catch (IOException e) {
            throw new RuntimeException("Failed to parse email list", e);
        }

        for (String emailAddress : recieverEmails) {
            inviteService.sendInvite(senderEmail, emailAddress);
            String notificationMessage = "Users will be added to the conversation after signup/login with the same email!";
            notificationManager.sendFlashNotification(notificationMessage, "short-noty");
            emailService.sendInviteEmail(emailAddress, userService.getUserByEmail(senderEmail).getUsername(), "http://www.localhost:8080");
        }
        return ResponseEntity.status(HttpStatus.FOUND)
                .header("Location", "/")
                .build();
    }

}
