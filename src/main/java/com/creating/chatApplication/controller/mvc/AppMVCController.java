package com.creating.chatApplication.controller.mvc;

import com.creating.chatApplication.entity.User;
import com.creating.chatApplication.service.EmailService;
import com.creating.chatApplication.service.InviteService;
import com.creating.chatApplication.service.NotificationManager;
import com.creating.chatApplication.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Controller
public class AppMVCController {

    private NotificationManager notificationManager;

    @Autowired
    private UserService userService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private InviteService inviteService;

    @GetMapping("/")
    public String home(Model model){
        String notificationMessage = notificationManager.getNotification();
        String notificationType = notificationManager.getNotificationType();
        model.addAttribute("notificationMessage", notificationMessage);
        model.addAttribute("notificationType", notificationType);
        notificationManager.clearNotification();
        return "home";
    }

    @GetMapping("/loginPage")
    public String login(){
        notificationManager.clearNotification();
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
        String token = generateVerificationToken(user);
        String verificationLink = "http://www.localhost:8080/verify?token=" + token;

        emailService.sendVerificationEmail(user.getEmail(), verificationLink);

        String notificationMessage = "We have sent an email, please verify your email id, link valid for 5 minutes !";
        notificationManager.sendFlashNotification(notificationMessage, "long-noty");
        return "redirect:/login"; // Redirect to login or another page
    }
    public String generateVerificationToken(User user) {
        String token = UUID.randomUUID().toString(); // Generate a unique token
        // Save the token in the database associated with the user
        user.setVerificationToken(token);
        user.setTokenExpiration(LocalDateTime.now().plusMinutes(5)); // Set expiration time
        userService.saveUser(user);
        return token;
    }


    @PatchMapping("/verify")
    public ResponseEntity<String> verifyEmail(@RequestParam String token) {
        User user = userService.findByVerificationToken(token); // Find user by token

        if (user == null) {
            return ResponseEntity.badRequest().body("Invalid verification token.");
        }

        if (user.getTokenExpiration().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Verification token has expired.");
        }

        user.setEnabled(true);
        generateVerificationToken(user);
        return ResponseEntity.ok("Email verified successfully.");
    }

    @GetMapping("/access-denied")
    public String deniedAccess(){
        return "access-denied";
    }
}