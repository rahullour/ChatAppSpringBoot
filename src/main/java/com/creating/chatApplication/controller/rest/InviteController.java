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
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashSet;
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
    public ResponseEntity<Void> sendInvite(@RequestParam String senderEmail, @RequestParam String emails, @RequestParam(required = false) boolean type, @RequestParam(required = false) String groupName, @RequestParam(required = false) MultipartFile profilePicture) {
        ObjectMapper objectMapper = new ObjectMapper();
        List<String> receiverEmails = null;
        UserGroup newUserGroup = null;
        try {
            receiverEmails = objectMapper.readValue(emails, new TypeReference<List<String>>() {});
            if(type){
                List<Invite> invites = inviteService.getInvitesAccepted(senderEmail, 1);
                List<Integer> inviteIds = new ArrayList<>();
                for(Invite i: invites){
                    inviteIds.add(i.getId());
                }
                HashSet<String> groupNames = new HashSet<>();
                if(inviteIds != null){
                    List<InviteGroup> inviteGroupsAttached = inviteGroupService.findInviteGroupsByInviteId(inviteIds);
                    for(InviteGroup ig: inviteGroupsAttached){
                        groupNames.add(ig.getUserGroup().getName());
                    }
                }
                if(groupNames.contains(groupName)){
                    notificationManager.sendFlashNotification(groupName + " group already exists, please delete chat and retry!", "alert-error", "short-noty");
                    return ResponseEntity.status(HttpStatus.FOUND)
                            .header("Location", "/")
                            .build();
                }
                newUserGroup = new UserGroup();
                newUserGroup.setName(groupName); // Set the name of the new UserGroup
                try {
                    byte[] imageBytes = profilePicture.getBytes();
                    String profilePictureBase64 = Base64.getEncoder().encodeToString(imageBytes);
                    newUserGroup.setProfilePictureUrl(profilePictureBase64);
                } catch (IOException e) {
                    e.printStackTrace();
                }
                String groupNameFormed = "group_" + groupName + "_" + userService.getUserByEmail(senderEmail).getId();
                for(String email: receiverEmails){
                    if(userService.getUserByEmail(email) != null) {
                        groupNameFormed = groupNameFormed + "_" + userService.getUserByEmail(email).getId();
                    }
                    else{
                        for (String emailAddress : receiverEmails) {
                            User user = userService.getUserByEmail(emailAddress);
                            if (user == null) {
                                String notificationMessage = "User with email ID: " + emailAddress + " not registered! Sending join link! Please resend invite later!";
                                notificationManager.sendFlashNotification(notificationMessage, "alert-danger", "medium-noty");
                                emailService.sendInviteEmail(emailAddress, userService.getUserByEmail(senderEmail).getUsername(), "http://www.localhost:8080/signup-form", type);
                                continue;
                            }
                        }
                        return ResponseEntity.status(HttpStatus.FOUND)
                                .header("Location", "/")
                                .build();

                    }
                }
                newUserGroup.setRoomId(groupNameFormed);
            }
            for (String emailAddress : receiverEmails) {
                User user = userService.getUserByEmail(emailAddress);
                try {
                    if(isValidEmail(emailAddress)) {
                        if (user == null) {
                            String notificationMessage = "User with email ID: " + emailAddress + " not registered! Sending join link! Please resend invite later!";
                            notificationManager.sendFlashNotification(notificationMessage, "alert-danger", "medium-noty");
                            emailService.sendInviteEmail(emailAddress, userService.getUserByEmail(senderEmail).getUsername(), "http://www.localhost:8080/signup-form", type);
                            continue;
                        }
                        if (type) {
                            // Create the invite
                            Invite invite = inviteService.createInvite(senderEmail, emailAddress, 1, null, "group_" + groupName + "_" + String.valueOf(userService.getUserByEmail(senderEmail).getId()));
                            // Create a new InviteGroup
                            InviteGroup inviteGroup = new InviteGroup();
                            inviteGroup.setInvite(invite); // Set the Invite for the InviteGroup

                            // Create the user group
                            userGroupService.saveUserGroup(newUserGroup);
                            List<InviteGroup> inviteGroups = new ArrayList<>();
                            inviteGroup.setUserGroup(newUserGroup); // Set the UserGroup for the InviteGroup
                            // Save the InviteGroup
                            inviteGroupService.saveInviteGroup(inviteGroup);
                        } else {
                            List<Invite> connections = inviteService.getInvites(senderEmail, emailAddress,  0);
                            if (!connections.isEmpty() && connections.getLast().isAccepted()) {
                                notificationManager.sendFlashNotification(emailAddress + " is connected already, please delete chat and retry!", "alert-error", "short-noty");
                                return ResponseEntity.status(HttpStatus.FOUND)
                                        .header("Location", "/")
                                        .build();
                            } else {
                                inviteService.createInvite(senderEmail, emailAddress, 0, null, "single_" + String.valueOf(userService.getUserByEmail(senderEmail).getId()) + "_" + String.valueOf(user.getId()));
                            }

                        }
                        String token = tokenGenerationService.generateToken(userService.getUserByEmail(senderEmail), "invite");
                        String verificationLink = "http://www.localhost:8080/verifyInviteUser?token=" + token + "&type=" + (type ? 1 : 0) + "&sender_id=" + userService.getUserByEmail(senderEmail).getId() + "&user_id=" + user.getId() + "&groupName=" + groupName;
                        String notificationMessage = "Chat with " + emailAddress + " will be enabled after email verification of joinee!";
                        notificationManager.sendFlashNotification(notificationMessage, "alert-success", "medium-noty");
                        emailService.sendInviteEmail(emailAddress, userService.getUserByEmail(senderEmail).getUsername(), verificationLink, type);
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
        return inviteService.getInvitesAccepted(userService.getCurrentUser().getEmail(), 0);
    }
    @GetMapping("/invites/group")
    public List<Invite> getGroupInvites(){
        return inviteService.getInvitesAccepted(userService.getCurrentUser().getEmail(), 1);
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



