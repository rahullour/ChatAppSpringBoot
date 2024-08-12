package com.creating.chatApplication.controller.mvc;

import com.creating.chatApplication.entity.Invite;
import com.creating.chatApplication.entity.User;
import com.creating.chatApplication.service.*;
import com.creating.chatApplication.service.user_room.UserRoomService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Controller
public class AppMVCController {

    @Autowired
    private NotificationManager notificationManager;

    @Autowired
    private UserService userService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private InviteService inviteService;

    private TokenGenerationService tokenGenerationService;


    @GetMapping("/")
    public String home(Model model) {
        List<com.creating.chatApplication.entity.Notification> notifications = notificationManager.getNotifications();
        model.addAttribute("notifications", notifications);
        return "home";
    }

    @GetMapping("/loginPage")
    public String login(){
        notificationManager.clearNotifications();
        return "login";
    }

    @GetMapping("/signup-form")
    public String login(Model model){
        model.addAttribute("user", new User());
        return "signup-form";
    }

    @PostMapping("/signup")
    public String signup(@Valid @ModelAttribute User user, BindingResult bindingResult, @RequestParam("profilePictureUrl") String profilePictureBase64) {
        if (bindingResult.hasErrors()) {
            return "signup-form"; // Return to the signup page if there are validation errors
        }

        // Set the Base64 string to the user object
        user.setProfilePictureUrl(profilePictureBase64);
        user.setEnabled(false);
        // Save the user to the database
        String token = tokenGenerationService.generateVerificationToken(user);
        String verificationLink = "http://www.localhost:8080/verifyEmail?user_id=" + user.getId() +"?token=" + token;

        emailService.sendVerificationEmail(user.getEmail(), verificationLink);

        String notificationMessage = "We have sent an email, please verify your email id, link valid for 5 minutes !";
        notificationManager.sendFlashNotification(notificationMessage, "medium-noty");
        return "redirect:/signup-form";
    }


    @PatchMapping("/verifyEmail")
    public ResponseEntity<String> verifyEmail(@RequestParam int user_id, @RequestParam String token) {
        User user = userService.findByVerificationTokenAndUserId(user_id, token);

        if (user == null) {
            return ResponseEntity.badRequest().body("Invalid verification token/user_id.");
        }

        if (user.getTokenExpiration().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Verification token has expired.");
        }

        user.setEnabled(true);
        tokenGenerationService.generateVerificationToken(user);
        return ResponseEntity.ok("Email verified successfully.");
    }

    @PatchMapping("/verifyInviteUser")
    public ResponseEntity<String> verifyChatJoin(@RequestParam int user_id, @RequestParam String token) {
        User user = userService.findByVerificationTokenAndUserId(user_id, token);

        if (user == null) {
            return ResponseEntity.badRequest().body("Invalid verification token/user_id.");
        }

        if (user.getTokenExpiration().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Verification token has expired.");
        }
        List<Invite> invites = inviteService.getInvitesForReciever(user.getEmail());
        for(Invite i:invites){
            i.setAccepted(true);
        }
        tokenGenerationService.generateVerificationToken(user);
        return ResponseEntity.ok("You have joined successfully.");
    }

    @GetMapping("/access-denied")
    public String deniedAccess(){
        return "access-denied";
    }
}