package com.creating.chatApplication.controller.mvc;

import com.creating.chatApplication.entity.Authority;
import com.creating.chatApplication.entity.Invite;
import com.creating.chatApplication.entity.FlashNotification;
import com.creating.chatApplication.entity.User;
import com.creating.chatApplication.service.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    @Autowired
    private TokenGenerationService tokenGenerationService;

    @Autowired
    private PasswordEncoder passwordEncoder;


    @GetMapping("/")
    public String home(Model model, HttpServletRequest request, HttpServletResponse response) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // Initialize user details
        String email = null;
        Boolean isEnabled = null;
        if (authentication != null && authentication.isAuthenticated()) {
            if (authentication.getPrincipal() instanceof CustomUserDetails) {
                CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
                isEnabled = userDetails.isEnabled();
            } else if (authentication.getPrincipal() instanceof OAuth2User) {
                OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();
                email = oauthUser.getAttribute("email");
                User user = userService.getUserByEmail(email);
                isEnabled = user.isEnabled();
            }
        }

        if(!isEnabled){
            new SecurityContextLogoutHandler().logout(request, response, authentication);
            notificationManager.clearNotifications();
            notificationManager.sendFlashNotification("Your account is disabled for now, please contact admin support @rahullour01@gmail.com.","alert-danger", "medium-noty");
            return "redirect:/loginPage";
        }

        List<FlashNotification> notifications = notificationManager.getNotifications();
        notificationManager.clearNotifications();
        model.addAttribute("notifications", notifications);
        notificationManager.clearNotifications();
        return "home";
    }

    @GetMapping("/loginPage")
    public String loginPage(HttpServletRequest request, Model model) {
        model.addAttribute("notifications", notificationManager.getNotifications());
        return "login";
    }

    @GetMapping("/signup-form")
    public String login(Model model){
        model.addAttribute("user", new User());
        return "signup-form";
    }

    @PostMapping("/signup")
    public String signup(@Valid  User user, BindingResult bindingResult, Model model, @RequestParam("profilePictureUrl") String profilePictureBase64) {
        if (bindingResult.hasErrors()) {
            for (FieldError error : bindingResult.getFieldErrors()) {
                notificationManager.sendFlashNotification(error.getDefaultMessage(), "alert-danger", "medium-noty");
            }
            List<FlashNotification> notifications = notificationManager.getNotifications();
            model.addAttribute("notifications", notifications);
            notificationManager.clearNotifications();
            return "signup-form";
        }
        String hashedPassword = passwordEncoder.encode(user.getPassword());
        user.setPassword(hashedPassword);
        user.setProfilePictureUrl(profilePictureBase64);
        user.setEnabled(false);
        Authority userAuthority = new Authority("USER_ROLE");
        List<Authority> authorities = new ArrayList<>();
        authorities.add(userAuthority);
        user.setAuthorities(authorities);
        String token = tokenGenerationService.generateVerificationToken(user);
        String verificationLink = "http://www.localhost:8080/verifyEmail?user_id=" + user.getId() +"?token=" + token;
        emailService.sendVerificationEmail(user.getEmail(), verificationLink);
        String notificationMessage = "We have sent an email, please verify your email id, link valid for 5 minutes !";
        notificationManager.sendFlashNotification(notificationMessage, "alert-success", "medium-noty");
        notificationManager.sendFlashNotification("Registration successful!", "alert-success", "short-noty");
        return "redirect:/loginPage";
    }


    @GetMapping("/verifyEmail")
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