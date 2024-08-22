package com.creating.chatApplication.controller.rest;

import com.creating.chatApplication.entity.Invite;
import com.creating.chatApplication.entity.User;
import com.creating.chatApplication.entity.UserGroup;
import com.creating.chatApplication.service.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailSendException;
import org.springframework.web.bind.annotation.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
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

    @Autowired
    private TokenGenerationService tokenGenerationService;

    @Autowired
    private UserGroupService userGroupService;

    @Autowired
    private InviteGroupService inviteGroupService;

    private static final String EMAIL_REGEX = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";

    public static boolean isValidEmail(String email) {
        if (email == null) {
            return false;
        }
        Pattern pattern = Pattern.compile(EMAIL_REGEX);
        Matcher matcher = pattern.matcher(email);
        return matcher.matches();
    }

    @PostMapping("/invites")
    public ResponseEntity<Void> sendInvite(@RequestParam String senderEmail, @RequestParam String emails, @RequestParam Boolean type, @RequestParam String groupName) {
        ObjectMapper objectMapper = new ObjectMapper();
        List<String> receiverEmails = null;
        try {
            receiverEmails = objectMapper.readValue(emails, new TypeReference<List<String>>() {});
            for (String emailAddress : receiverEmails) {
                User user = userService.getUserByEmail(emailAddress);
                try {
                    if(isValidEmail(emailAddress)) {
                        if (user != null && !user.getEmail().equals(senderEmail)) {
                            List<Invite> connections = inviteService.getInvites(senderEmail, emailAddress);
                            if (!connections.isEmpty() && connections.getLast().isAccepted()) {
                                notificationManager.sendFlashNotification(emailAddress + " is connected already !", "alert-success", "short-noty");
                                return ResponseEntity.status(HttpStatus.FOUND)
                                        .header("Location", "/")
                                        .build();
                            }
                            for(Invite i: connections){
                                inviteService.rejectInvite(i.getId());
                            }
                            Invite invite = inviteService.createInvite(senderEmail, emailAddress, type ? 1 : 0);
                            if(type){
                                UserGroup user_group = userGroupService.createUserGroup(groupName);
                                inviteGroupService.createInviteGroup(user_group, invite);
                            }
                            String token = tokenGenerationService.generateVerificationToken(user);
                            String verificationLink = "http://www.localhost:8080/verifyInviteUser?user_id=" + user.getId() + "&token=" + token;
                            String notificationMessage = "Chat with " + emailAddress + " will be enabled after verification!";
                            notificationManager.sendFlashNotification(notificationMessage, "alert-success", "medium-noty");
                            emailService.sendInviteEmail(emailAddress, userService.getUserByEmail(senderEmail).getUsername(), verificationLink);
                        }
                        else{
                            String notificationMessage = "User with email ID: " + emailAddress + " not registered! Sending join link! PLease resend invite later!";
                            notificationManager.sendFlashNotification(notificationMessage, "alert-danger", "medium-noty");
                            emailService.sendInviteEmail(emailAddress, userService.getUserByEmail(senderEmail).getUsername(), "http://www.localhost:8080/signup-form");
                        }
                    }
                    else{
                        String notificationMessage = "Invalid email id: " + emailAddress;
                        notificationManager.sendFlashNotification(notificationMessage, "alert-danger", "medium-noty");
                    }

                } catch (MailSendException e) {
                    String notificationMessage = "Failed to send invite to " + emailAddress + ": " + e.getMessage();
                    notificationManager.sendFlashNotification(notificationMessage, "alert-danger", "medium-noty");
                }
            }
        } catch (Exception e) {
            String notificationMessage = e.getMessage();
            notificationManager.sendFlashNotification(notificationMessage, "alert-danger", "medium-noty");
        }
        return ResponseEntity.status(HttpStatus.FOUND)
                .header("Location", "/")
                .build();
    }
}



