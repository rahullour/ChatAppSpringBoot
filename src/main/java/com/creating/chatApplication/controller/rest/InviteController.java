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
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api")
public class InviteController {

    @Autowired
    private NotificationManager notificationManager;

    @Autowired
    private GmailEmailServiceImpl emailService;

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
    public ResponseEntity<Map<String, String>> sendInvite(@RequestParam String senderEmail, @RequestParam String emails, @RequestParam(required = false) boolean type, @RequestParam(required = false) String groupName, @RequestParam(required = false) MultipartFile profilePicture) {
        ObjectMapper objectMapper = new ObjectMapper();
        UserGroup newUserGroup = null;
        Map<String, String> responseData = new HashMap<>();
        try {
            List<String> receiverEmails = new ArrayList<>();

            // FIX: Avoid Jackson ObjectMapper completely for plain string parsing
            if (emails != null && !emails.trim().isEmpty()) {
                try {
                    // Split the string by commas and clean up any accidental spaces
                    String[] emailArray = emails.split(",");
                    for (String email : emailArray) {
                        if (!email.trim().isEmpty()) {
                            receiverEmails.add(email.trim());
                        }
                    }
                } catch (Exception e) {
                    String notificationMessage = e.getMessage();
//                    notificationManager.sendFlashNotification(notificationMessage, "danger", "medium-noty");
                    responseData.put("message", notificationMessage);
                    responseData.put("type", "danger");
                    responseData.put("durationType", "medium-noty");
                    return ResponseEntity.badRequest().body(responseData); // Return a clean error response
                }
            } else {
//                notificationManager.sendFlashNotification("Email list cannot be empty", "danger", "medium-noty");
                responseData.put("message", "Email list cannot be empty");
                responseData.put("type", "danger");
                responseData.put("durationType", "medium-noty");
                return ResponseEntity.badRequest().body(responseData);
            }
            for(String email: receiverEmails) {
                if(senderEmail.equals(email)){
                    String notificationMessage = "You cannot invite yourself !";
//                    notificationManager.sendFlashNotification(notificationMessage, "danger", "short-noty");
                    responseData.put("message", notificationMessage);
                    responseData.put("type", "danger");
                    responseData.put("durationType", "short-noty");
                    return ResponseEntity.badRequest().body(responseData);
                }
            }
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
//                    notificationManager.sendFlashNotification(groupName + " group already exists, please delete chat and retry!", "error", "short-noty");
                    responseData.put("message", groupName + " group already exists, please delete chat and retry!");
                    responseData.put("type", "error");
                    responseData.put("durationType", "short-noty");
                    return ResponseEntity.badRequest().body(responseData);
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
//                                notificationManager.sendFlashNotification(notificationMessage, "danger", "medium-noty");
                                responseData.put("message", notificationMessage);
                                responseData.put("type", "danger");
                                responseData.put("durationType", "medium-noty");

                                String link = "https://chatappspringboot.onrender.com/signup-form";
                                emailService.sendInviteEmail(emailAddress, userService.getUserByEmail(senderEmail).getUsername(), senderEmail, link, type);
                                continue;
                            }
                        }
                        return ResponseEntity.badRequest().body(responseData);
                    }
                }
                newUserGroup.setRoomId(groupNameFormed);
            }
            for (String emailAddress : receiverEmails) {
                User user = userService.getUserByEmail(emailAddress);
                try {
                    if(isValidEmail(emailAddress)) {
                        String tokenRoomId = "";
                        if (user == null) {
                            String notificationMessage = "User with email ID: " + emailAddress + " not registered! Sending join link! Please resend invite later!";
//                            notificationManager.sendFlashNotification(notificationMessage, "danger", "medium-noty");
                            responseData.put("message", notificationMessage);
                            responseData.put("type", "danger");
                            responseData.put("durationType", "medium-noty");

                            String link = "https://chatappspringboot.onrender.com/signup-form";
                            emailService.sendInviteEmail(emailAddress, userService.getUserByEmail(senderEmail).getUsername(), senderEmail, link, type);
                            return ResponseEntity.badRequest().body(responseData);
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
                            tokenRoomId = invite.getRoomId();
                        } else {
                            List<Invite> connections = inviteService.getInvites(senderEmail, emailAddress,  0);
                            if (!connections.isEmpty() && connections.getLast().isAccepted()) {
//                                notificationManager.sendFlashNotification(emailAddress + " is connected already, please delete chat and retry!", "error", "short-noty");
                                responseData.put("message", emailAddress + " is connected already, please delete chat and retry!");
                                responseData.put("type", "error");
                                responseData.put("durationType", "short-noty");
                                return ResponseEntity.badRequest().body(responseData);
                            } else {
                                String inviteRoomId = "single_" + String.valueOf(userService.getUserByEmail(senderEmail).getId()) + "_" + String.valueOf(user.getId());
                                inviteService.createInvite(senderEmail, emailAddress, 0, null, inviteRoomId);
                                tokenRoomId = inviteRoomId;
                            }

                        }
                        String token = tokenGenerationService.generateToken(userService.getUserByEmail(senderEmail), "invite", tokenRoomId);
                        String verificationLink = String.format(
                                "https://chatappspringboot.onrender.com/verifyInviteUser?token=%s&type=%d&sender_id=%d&user_id=%d&groupName=%s",
                                token,
                                type ? 1 : 0,
                                userService.getUserByEmail(senderEmail).getId(),
                                user.getId(),
                                groupName
                        );
                        String notificationMessage = "Chat with " + emailAddress + " will be enabled after verification by joinee via their email !";
//                        notificationManager.sendFlashNotification(notificationMessage, "success", "medium-noty");
                        responseData.put("message", notificationMessage);
                        responseData.put("type", "success");
                        responseData.put("durationType", "medium-noty");

                        emailService.sendInviteEmail(emailAddress, userService.getUserByEmail(senderEmail).getUsername(), senderEmail, verificationLink, type);
                    }
                    else{
                        String notificationMessage = "Invalid email id: " + emailAddress;
//                        notificationManager.sendFlashNotification(notificationMessage, "danger", "medium-noty");
                        responseData.put("message", notificationMessage);
                        responseData.put("type", "danger");
                        responseData.put("durationType", "medium-noty");
                        return ResponseEntity.badRequest().body(responseData);
                    }

                } catch (Exception e) {
                    String notificationMessage = "Failed to send invite to " + emailAddress + ": " + e.getMessage();
//                    notificationManager.sendFlashNotification(notificationMessage, "danger", "medium-noty");
                    responseData.put("message", notificationMessage);
                    responseData.put("type", "danger");
                    responseData.put("durationType", "medium-noty");
                    return ResponseEntity.badRequest().body(responseData);
                }
            }
        } catch (Exception e) {
            String notificationMessage = e.getMessage();
//            notificationManager.sendFlashNotification(notificationMessage, "danger", "medium-noty");
            responseData.put("message", notificationMessage);
            responseData.put("type", "danger");
            responseData.put("durationType", "medium-noty");
            return ResponseEntity.badRequest().body(responseData);
        }
//        notificationManager.clearNotifications();
        return ResponseEntity.ok(responseData);

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



