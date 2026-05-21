package com.creating.chatApplication.controller.rest;

import com.creating.chatApplication.entity.Invite;
import com.creating.chatApplication.entity.InviteGroup;
import com.creating.chatApplication.entity.User;
import com.creating.chatApplication.entity.UserGroup;
import com.creating.chatApplication.repository.UserGroupRepository;
import com.creating.chatApplication.service.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

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
    private TokenServiceImpl tokenServiceImpl;

    @Autowired
    private InviteServiceImpl inviteServiceImpl;

    @Autowired
    private TokenGenerationService tokenGenerationService;

    @Autowired
    private UserGroupService userGroupService;

    @Autowired
    private InviteGroupService inviteGroupService;

    @Autowired
    private InviteGroupServiceImpl inviteGroupServiceImpl;

    @Autowired
    private UserGroupServiceImpl userGroupServiceImpl;

    @Autowired
    private TokenService tokenService;


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
            String[] emailArray = {};
            // Error Checks -
            // Checks for bad email ids, already registered users
            if (emails != null && !emails.trim().isEmpty()) {
                try {
                    // Split the string by commas and clean up any accidental spaces, reuse below
                    emailArray = emails.split(",");
                    ArrayList<String> invalidEmails = new ArrayList<>();
                    for (String email : emailArray) {
                        if (!email.trim().isEmpty()) {
                            if(!isValidEmail(email)) {
                                invalidEmails.add(email);
                            }
                            // add all emails to array first
                            receiverEmails.add(email.trim());
                        }
                    }
                    if(!invalidEmails.isEmpty()){
                        String notificationMessage = "Invalid email id/s: " + invalidEmails;
                        responseData.put("message", notificationMessage);
                        responseData.put("type", "danger");
                        responseData.put("durationType", "medium-noty");
                        return ResponseEntity.badRequest().body(responseData);
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
                responseData.put("message", "Email list cannot be empty");
                responseData.put("type", "danger");
                responseData.put("durationType", "medium-noty");
                return ResponseEntity.badRequest().body(responseData);
            }
            // Checks for bad email ids, already registered users - ends

            boolean foundSelfInvite = false;
            ArrayList<String> unregisteredUsers = new ArrayList<>();
            ArrayList<Integer> groupNameSuffix = new ArrayList<>();
            for(String email: receiverEmails) {
                groupNameSuffix.add(userService.getUserByEmail(email).getId());
                if(senderEmail.equals(email)){
                    foundSelfInvite = true;
                }
                if (userService.getUserByEmailAndStatus(email, true) == null) {
                    unregisteredUsers.add(email);
                    String link = "https://chatappspringboot.onrender.com/signup-form";
                    emailService.sendInviteEmail(email, userService.getUserByEmail(senderEmail).getUsername(), senderEmail, link, type);
                }
            }

            // response for foundSelfInvite And unregisteredUserInvite
            ArrayList<String> selfAndUnregisteredInviteResponse = new ArrayList<>();
            if(foundSelfInvite){
                selfAndUnregisteredInviteResponse.add("You cannot invite yourself !");
            }
            if(!unregisteredUsers.isEmpty()){
                selfAndUnregisteredInviteResponse.add("User/s with email Id/s: " + unregisteredUsers + " not registered, sending join link, please resend invite later");
            }
            if(foundSelfInvite || !unregisteredUsers.isEmpty()){
                responseData.put("message", String.join(", ", selfAndUnregisteredInviteResponse));
                responseData.put("type", "danger");
                responseData.put("durationType", "medium-noty");
                return ResponseEntity.badRequest().body(responseData);
            }
            // group names creation

            // add sender id to groupNameSuffix at end
            groupNameSuffix.add(userService.getUserByEmail(senderEmail).getId());
            // sort the groupNameSuffix
            Collections.sort(groupNameSuffix);
            // group name structure - "groupType" + "_" + "groupName" + "_" + "groupNameSuffix i.e Sorted Receivers' Ids"
            String groupNameFormed =
                    "group_" +
                            groupName +
                            "_" +
                            groupNameSuffix.stream()
                                    .map(String::valueOf)
                                    .collect(Collectors.joining(""));

            // group name structure - "groupType" + "_" + "groupNameSuffix i.e Receiver Id"
            String inviteRoomId = "single_" + groupNameSuffix.stream()
                    .map(String::valueOf)
                    .collect(Collectors.joining(""));

            // Checks for already connected users
            ArrayList<String> alreadyConnectedUsers = new ArrayList<>();
            HashSet<String> acceptedUniqueEmails = new HashSet<>();

            HashSet<String> invitesUniqueRoomsNamesWithAcceptedStatus = new HashSet<>();
            ArrayList<Invite> allInvites = new ArrayList<>();
            ArrayList<Invite> invitesWithCommonGroupNameAccepted = new ArrayList<>();

            if(type){
                List<UserGroup> userGroups = userGroupServiceImpl.getAllUserGroupsByName(groupName);
                for(UserGroup ug:userGroups){
                   List<InviteGroup> inviteGroups = inviteGroupServiceImpl.getAllInviteGroupByGroupId(ug.getId());
                   for(InviteGroup ig: inviteGroups){
                       if(ig.getInvite().isAccepted()){
                           invitesUniqueRoomsNamesWithAcceptedStatus.add(ig.getInvite().getRoomId());
                       }
                       allInvites.add(ig.getInvite());
                   }

                }
                // get accepted/notaccepted invites by roomIds
                for(Invite i: allInvites){
                    if(invitesUniqueRoomsNamesWithAcceptedStatus.contains(i.getRoomId())){
                        invitesWithCommonGroupNameAccepted.add(i);
                        acceptedUniqueEmails.add(i.getSenderEmail());
                        acceptedUniqueEmails.add(i.getRecipientEmail());
                    }
                }
                alreadyConnectedUsers.addAll(acceptedUniqueEmails);
            }
            else{
                for (String email : emailArray) {
                    // checking both ways
                    List<Invite> connections = inviteService.getInvites(senderEmail, email, 0);
                    if (!connections.isEmpty() && connections.getLast().isAccepted()) {
                        alreadyConnectedUsers.add(email);
                    }
                    List<Invite> connections2 = inviteService.getInvites(email, senderEmail, 0);
                    if (!connections2.isEmpty() && connections2.getLast().isAccepted()) {
                        alreadyConnectedUsers.add(email);
                    }
                }
            }
            List<String>  receiverEmailsCopy=
                    new ArrayList<>(receiverEmails);
            // also add sender email if not present
            if(!receiverEmailsCopy.contains(senderEmail)){
                receiverEmailsCopy.add(senderEmail);
            }
            //to get already connected emails present in receiverEmails
            receiverEmailsCopy.retainAll(alreadyConnectedUsers);
            // add you to list if you are part of the group
            if(!receiverEmailsCopy.contains(senderEmail) && alreadyConnectedUsers.contains(senderEmail)){
                    receiverEmailsCopy.add("You");
            }
            for(int i=0; i<receiverEmailsCopy.size(); i++){
                if(receiverEmailsCopy.get(i) == senderEmail){
                    receiverEmailsCopy.set(i, "You");
                }
            }
            String messagereceiverEmailsCopy = receiverEmailsCopy + " is/are connected already or chat joins pending, please delete chat and retry. ";
            if(!receiverEmailsCopy.contains("You")){
                messagereceiverEmailsCopy = messagereceiverEmailsCopy + "If you are not part of the group please ask either of them to send you the join link";
            }
            else{
                messagereceiverEmailsCopy = receiverEmailsCopy + " is/are connected already or chat joins pending, please delete chat and retry. If you wish to add someone else, please send them an invite from within the group's add member option";
            }
            if(!alreadyConnectedUsers.isEmpty()){
                responseData.put("message",  messagereceiverEmailsCopy);
                responseData.put("type", "danger");
                responseData.put("durationType", "medium-noty");
                return ResponseEntity.badRequest().body(responseData);
            }

            // group invite related data config

            if(type){
                newUserGroup = new UserGroup();
                newUserGroup.setName(groupName); // Set the name of the new UserGroup
                try {
                    byte[] imageBytes;
                    String profilePictureBase64 = "";
                    if(profilePicture == null){
                        ClassPathResource resource = new ClassPathResource("static/images/profile-image.png");
                        imageBytes = resource.getInputStream().readAllBytes();
                        profilePictureBase64 = Base64.getEncoder().encodeToString(imageBytes);
                    }
                    else{
                        imageBytes = profilePicture.getBytes();
                        profilePictureBase64 = Base64.getEncoder().encodeToString(imageBytes);

                    }
                    newUserGroup.setProfilePictureUrl(profilePictureBase64);
                } catch (IOException e) {
                    e.printStackTrace();
                }
                newUserGroup.setRoomId(groupNameFormed);
            }

            // clear prev invites data

            List<Integer> not_accepted_ids = inviteServiceImpl.getAllInviteIdsByRoomIdAndNotAccepted(type ? groupNameFormed : inviteRoomId);
            for(Integer x: not_accepted_ids) {
                inviteGroupServiceImpl.rejectInviteGroupByInviteId(x);
                inviteServiceImpl.rejectInvite(x);
                // expire old invites for the group before sending new invites for the group
                tokenServiceImpl.deleteByRoomId(type ? groupNameFormed : inviteRoomId);
            }

            // send invites

            ArrayList<String> invitesSentEmails = new ArrayList<>();
            for (String emailAddress : receiverEmails) {
                User user = userService.getUserByEmail(emailAddress);
                try {
                    String tokenRoomId = "";
                    if (type) {
                        // Create the invite
                        Invite invite = inviteService.createInvite(senderEmail, emailAddress, 1, null, groupNameFormed);
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
                            inviteService.createInvite(senderEmail, emailAddress, 0, null, inviteRoomId);
                            tokenRoomId = inviteRoomId;
                    }
                    String token = tokenGenerationService.generateToken(userService.getUserByEmail(senderEmail), "invite", tokenRoomId);
                    String verificationLink = String.format(
                            "https://chatappspringboot.onrender.com/verifyInviteUser?token=%s&type=%d&sender_id=%d&user_id=%d&groupName=%s&roomId=%s",
                            token,
                            type ? 1 : 0,
                            userService.getUserByEmail(senderEmail).getId(),
                            user.getId(),
                            groupName,
                            type ? groupNameFormed : inviteRoomId
                    );
                    invitesSentEmails.add(emailAddress);
                    emailService.sendInviteEmail(emailAddress, userService.getUserByEmail(senderEmail).getUsername(), senderEmail, verificationLink, type);
                } catch (Exception e) {
                    String notificationMessage = "Failed to send invite to " + emailAddress + ": " + e.getMessage();
                    responseData.put("message", notificationMessage);
                    responseData.put("type", "danger");
                    responseData.put("durationType", "medium-noty");
                    return ResponseEntity.badRequest().body(responseData);
                }
            }
            String notificationMessage = "Chat with " + invitesSentEmails + " will be enabled after verification by joinee via their email";
            responseData.put("message", notificationMessage);
            responseData.put("type", "success");
            responseData.put("durationType", "medium-noty");
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
        return inviteService.getInvitesBySenderOrReceiverEmailAccepted(userService.getCurrentUser().getEmail(), 0);
    }
    @GetMapping("/invites/group")
    public List<Invite> getGroupInvites(){
        return inviteService.getInvitesBySenderOrReceiverEmailAccepted(userService.getCurrentUser().getEmail(), 1);
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



