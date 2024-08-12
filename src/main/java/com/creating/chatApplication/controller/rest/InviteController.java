package com.creating.chatApplication.controller.rest;

import com.creating.chatApplication.entity.User;
import com.creating.chatApplication.service.*;
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

    private TokenGenerationService tokenGenerationService;


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
            User user = userService.getUserByEmail("emailAddress");
            if(user != null && !user.getEmail().equals(senderEmail)){
                inviteService.sendInvite(senderEmail, emailAddress);
                String token = tokenGenerationService.generateVerificationToken(user);
                String verificationLink = "http://www.localhost:8080/verifyInviteUser?user_id=" + user.getId() +"?token=" + token;
                String notificationMessage = "Chat with" + emailAddress + " will be enabled after verification!";
                notificationManager.sendFlashNotification(notificationMessage, "short-noty");
                emailService.sendInviteEmail(emailAddress, userService.getUserByEmail(senderEmail).getUsername(), verificationLink);
            }
            else{
                String notificationMessage = "User with emailid: " + emailAddress + " not registered!, sending join link!";
                notificationManager.sendFlashNotification(notificationMessage, "medium-noty");
                emailService.sendInviteEmail(emailAddress, userService.getUserByEmail(senderEmail).getUsername(), "http://www.localhost:8080/signup-form");
            }
        }
        return ResponseEntity.status(HttpStatus.FOUND)
                .header("Location", "/")
                .build();
    }

}
