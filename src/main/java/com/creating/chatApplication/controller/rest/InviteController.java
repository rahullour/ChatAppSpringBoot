package com.creating.chatApplication.controller.rest;

import com.creating.chatApplication.entity.Invite;
import com.creating.chatApplication.entity.InviteGroup;
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

import java.util.ArrayList;
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
    public ResponseEntity<Void> sendInvite(@RequestParam String senderEmail, @RequestParam String emails, @RequestParam(required = false) boolean type, @RequestParam(required = false) String groupName) {
        ObjectMapper objectMapper = new ObjectMapper();
        List<String> receiverEmails = null;
        try {
            receiverEmails = objectMapper.readValue(emails, new TypeReference<List<String>>() {});
            for (String emailAddress : receiverEmails) {
                User user = userService.getUserByEmail(emailAddress);
                try {
                    if(isValidEmail(emailAddress)) {
                        if (user != null && !user.getEmail().equals(senderEmail)) {
                            List<Invite> connections = inviteService.getInvites(senderEmail, emailAddress, type ? 1 : 0);
                            if (!connections.isEmpty() && connections.getLast().isAccepted()) {
                                notificationManager.sendFlashNotification(emailAddress + " is connected already !", "alert-success", "short-noty");
                                return ResponseEntity.status(HttpStatus.FOUND)
                                        .header("Location", "/")
                                        .build();
                            }
                            connections.addAll(inviteService.getInvites(emailAddress, senderEmail, type ? 1 : 0));
                            for(Invite i: connections){
                                inviteGroupService.rejectInviteGroup(i.getId());
                                inviteService.rejectInvite(i.getId());
                            }
                            if(type){
                                // Create the invite
                                Invite invite = inviteService.createInvite(senderEmail, emailAddress, 1, null, "group_" + groupName + "_" + String.valueOf(userService.getUserByEmail(senderEmail).getId()));
                                Invite invite_other = inviteService.createInvite(emailAddress, senderEmail, 1, null, "group_" + groupName + "_" + String.valueOf(userService.getUserByEmail(senderEmail).getId()));
// Create a new InviteGroup
                                InviteGroup inviteGroup = new InviteGroup();
                                inviteGroup.setInvite(invite); // Set the Invite for the InviteGroup

                                InviteGroup inviteGroupOther = new InviteGroup();
                                inviteGroupOther.setInvite(invite_other);

// Check if the UserGroup already exists
                                UserGroup existingUserGroup = userGroupService.findUserGroupByName(groupName); // Implement this method to find UserGroup by name

                                if (existingUserGroup != null) {
                                    // If the UserGroup exists, add the new InviteGroup to its list
                                    inviteGroup.setUserGroup(existingUserGroup); // Set the UserGroup for the InviteGroup
                                    inviteGroupOther.setUserGroup(existingUserGroup);

                                    // Save the InviteGroup
                                    inviteGroupService.saveInviteGroup(inviteGroup);
                                    inviteGroupService.saveInviteGroup(inviteGroupOther);
                                } else {
                                    // If the UserGroup does not exist, create a new one
                                    UserGroup newUserGroup = new UserGroup();
                                    newUserGroup.setName(groupName); // Set the name of the new UserGroup
                                    List<InviteGroup> inviteGroups = new ArrayList<>();
                                    inviteGroups.add(inviteGroup); // Add the new InviteGroup to the list
                                    inviteGroups.add(inviteGroupOther);
                                    inviteGroup.setUserGroup(newUserGroup); // Set the UserGroup for the InviteGroup
                                    inviteGroupOther.setUserGroup(newUserGroup);
                                    // Save the new UserGroup
                                    userGroupService.saveUserGroup(newUserGroup);

                                    // Save the InviteGroup
                                    inviteGroupService.saveInviteGroup(inviteGroup);
                                    inviteGroupService.saveInviteGroup(inviteGroupOther);
                                }
                            }else{
                                inviteService.createInvite(senderEmail, emailAddress, 0, null, "single_" + String.valueOf(userService.getUserByEmail(senderEmail).getId()) + "_" + String.valueOf(user.getId()));
                                inviteService.createInvite(emailAddress, senderEmail, 0, null, "single_" + String.valueOf(userService.getUserByEmail(senderEmail).getId()) + "_" + String.valueOf(user.getId()));
                            }

                            String token = tokenGenerationService.generateVerificationToken(user);
                            String verificationLink = "http://www.localhost:8080/verifyInviteUser?user_id=" + user.getId() + "&token=" + token + "&type=" + (type ? 1 : 0) + "&sender_id=" + userService.getUserByEmail(senderEmail).getId() + "&groupName=" + groupName;
                            String notificationMessage = "Chat with " + emailAddress + " will be enabled after email verification of joinee!";
                            notificationManager.sendFlashNotification(notificationMessage, "alert-success", "medium-noty");
                            emailService.sendInviteEmail(emailAddress, userService.getUserByEmail(senderEmail).getUsername(), verificationLink, type);

                        }
                        else{
                            String notificationMessage = "User with email ID: " + emailAddress + " not registered! Sending join link! Please resend invite later!";
                            notificationManager.sendFlashNotification(notificationMessage, "alert-danger", "medium-noty");
                            emailService.sendInviteEmail(emailAddress, userService.getUserByEmail(senderEmail).getUsername(), "http://www.localhost:8080/signup-form", type);
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
    @GetMapping("/invites/single")
    public List<Invite> getSingleInvites(){
        return inviteService.getInvitesBySenderEmailAccepted(userService.getCurrentUser().getEmail(),  0);
    }
    @GetMapping("/invites/group")
    public List<Invite> getGroupInvites(){
        return inviteService.getInvitesBySenderEmailAccepted(userService.getCurrentUser().getEmail(), 1);
    }
    @GetMapping("/user_groups")
    public UserGroup getUserGroups(@RequestParam int groupId){
        return userGroupService.findUserGroupById(groupId);
    }
    @GetMapping("/invite_groups")
    public InviteGroup getInviteGroups(@RequestParam int inviteId) {
        return inviteGroupService.findInviteGroupByInviteId(inviteId);
    }
}



