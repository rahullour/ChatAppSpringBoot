package com.creating.chatApplication.controller.mvc;

import com.creating.chatApplication.entity.*;
import com.creating.chatApplication.repository.ThemeRepository;
import com.creating.chatApplication.service.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
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
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;

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

    @Autowired
    private Firestore firestore;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private ThemeRepository themeRepository;

    @GetMapping("/")
    public String home(Model model, HttpServletRequest request, HttpServletResponse response) {
        User user_profile = userService.getCurrentUser(); // Fetch the current user
        model.addAttribute("user", user_profile);
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
            notificationManager.sendFlashNotification("Your account is disabled for now, have you verified your email via the link we sent you?, else please contact admin support wechatcorporations@gmail.com.","alert-danger", "medium-noty");
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
        notificationManager.clearNotifications();
        return "login";
    }

    @GetMapping("/signup-form")
    public String login(Model model){
        model.addAttribute("user", new User());
        model.addAttribute("notifications", notificationManager.getNotifications());
        notificationManager.clearNotifications();
        return "signup-form";
    }


    @PostMapping("/signup")
    public String signup(@Valid @ModelAttribute("user") User user, BindingResult bindingResult,
                         Model model, @RequestParam("profilePicture") MultipartFile profilePicture,
                         @RequestParam("confirmPassword") String confirmPassword) {

        // First check if there are any validation errors
        if (bindingResult.hasErrors()) {
            for (FieldError error : bindingResult.getFieldErrors()) {
                notificationManager.sendFlashNotification(error.getDefaultMessage(), "alert-danger", "medium-noty");
            }
            List<FlashNotification> notifications = notificationManager.getNotifications();
            model.addAttribute("notifications", notifications);
            notificationManager.clearNotifications();
            return "signup-form";
        }

        // Check if passwords match
        if (!user.getPassword().equals(confirmPassword)) {
            notificationManager.sendFlashNotification("Passwords do not match", "alert-danger", "medium-noty");
            List<FlashNotification> notifications = notificationManager.getNotifications();
            model.addAttribute("notifications", notifications);
            notificationManager.clearNotifications();
            return "signup-form";
        }
        if (userService.getUserByEmail(user.getEmail()) != null) {
            notificationManager.sendFlashNotification("Username already exists !", "alert-danger", "short-noty");
            List<FlashNotification> notifications = notificationManager.getNotifications();
            model.addAttribute("notifications", notifications);
            notificationManager.clearNotifications();
            return "signup-form";
        }
        String hashedPassword = passwordEncoder.encode(user.getPassword());
        user.setPassword(hashedPassword);
        try {
            if(profilePicture.isEmpty()){
                String profileImageUrl = convertImageToBase64("src/main/resources/static/images/profile-image.png");
                user.setProfilePictureUrl(profileImageUrl);
            }
            else{
                byte[] imageBytes = profilePicture.getBytes();
                String profilePictureBase64 = Base64.getEncoder().encodeToString(imageBytes);
                user.setProfilePictureUrl(profilePictureBase64);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        user.setEnabled(false);
        user.setTheme(themeRepository.findById(1).orElse(null));
        Authority userAuthority = new Authority("ROLE_USER");
        userAuthority.setUser(user);
        List<Authority> authorities = new ArrayList<>();
        authorities.add(userAuthority);
        user.setAuthorities(authorities);
        String token = tokenGenerationService.generateVerificationToken(user);
        String verificationLink = "http://www.localhost:8080/verifyEmail?user_id=" + user.getId() +"&token=" + token;
        emailService.sendVerificationEmail(user.getEmail(), verificationLink);
        String notificationMessage = "We have sent an email, please verify your email id, link valid for 5 minutes !";
        notificationManager.sendFlashNotification(notificationMessage, "alert-success", "medium-noty");
        notificationManager.sendFlashNotification("Registration successful!", "alert-success", "short-noty");
        return "redirect:/loginPage";
    }

    private String convertImageToBase64(String imagePath) {
        try {
            byte[] imageBytes = Files.readAllBytes(Paths.get(imagePath));
            return Base64.getEncoder().encodeToString(imageBytes);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    @GetMapping("/verifyResetEmail")
    public String verifyResetEmail(@RequestParam String email) {
        User user = userService.getUserByEmail(email);
        if (user == null) {
            notificationManager.sendFlashNotification("Invalid email !", "alert-danger", "short-noty");
            return "redirect:/loginPage";
        }
        else {
            String token = tokenGenerationService.generateVerificationToken(user);
            String verificationLink = "http://www.localhost:8080/resetPassword?user_id=" + user.getId() +"&token=" + token;
            emailService.sendPasswordResetEmail(user.getEmail(), verificationLink);
            String notificationMessage = "We have sent an email, please verify yourself, link valid for 5 minutes !";
            notificationManager.sendFlashNotification(notificationMessage, "alert-success", "medium-noty");
        }
        return "redirect:/loginPage";
    }

    @GetMapping("/resetPassword")
    public String resetPassword(@RequestParam int user_id, @RequestParam String token, RedirectAttributes redirectAttributes, Model model) {
        User user = userService.findByVerificationTokenAndUserId(user_id, token);
        if (user == null) {
            notificationManager.sendFlashNotification("Invalid verification token/user_id !", "alert-danger", "short-noty");
            return "redirect:/loginPage";
        }
        else if (user.getTokenExpiration().isBefore(LocalDateTime.now())) {
            notificationManager.sendFlashNotification("Verification token has expired, please re-create reset password request !", "alert-danger", "short-noty");
            return "redirect:/loginPage";
        }

        notificationManager.sendFlashNotification("Please enter new password details !", "alert-success", "short-noty");
        model.addAttribute("user_id", user_id);
        model.addAttribute("token", token);
        model.addAttribute("notifications", notificationManager.getNotifications());
        model.addAttribute("user", user);
        notificationManager.clearNotifications();
        return "forgot-password-form";
    }

    @PostMapping("/passwordResetFormSubmit")
    public String passwordResetFormSubmit(@Valid @ModelAttribute("user") User user, BindingResult bindingResult, Model model, @RequestParam int user_id, @RequestParam String token, HttpServletResponse response) throws IOException {
        boolean errors = false;
        if (user.getPassword() == null || user.getPassword().isEmpty()) {
            notificationManager.sendFlashNotification("Password is required", "alert-danger", "medium-noty");
            errors = true;
        } else if (user.getPassword().length() < 6 || user.getPassword().length() > 100) {
            notificationManager.sendFlashNotification("Password must be between 6 and 100 characters", "alert-danger", "medium-noty");
            errors = true;
        }

        if (errors) {
            model.addAttribute("notifications", notificationManager.getNotifications());
            response.sendRedirect("http://www.localhost:8080/resetPassword?user_id=" + user_id + "&token=" + token);
            return null;
        }

        User sent_user = userService.findByVerificationTokenAndUserId(user_id, token);
        if (sent_user == null) {
            notificationManager.sendFlashNotification("Invalid verification token/user_id !", "alert-danger", "short-noty");
            model.addAttribute("notifications", notificationManager.getNotifications());
            notificationManager.clearNotifications();
            return "redirect:/loginPage";
        }
        else if (sent_user.getTokenExpiration().isBefore(LocalDateTime.now())) {
            notificationManager.sendFlashNotification("Verification token has expired, please re-create reset password request !", "alert-danger", "short-noty");
            model.addAttribute("notifications", notificationManager.getNotifications());
            notificationManager.clearNotifications();
            return "redirect:/loginPage";
        }
        String hashedPassword = passwordEncoder.encode(user.getPassword());
        sent_user.setPassword(hashedPassword);
        userService.saveUser(sent_user);
        tokenGenerationService.generateVerificationToken(sent_user);
        notificationManager.sendFlashNotification("Your password has been reset !", "alert-success", "short-noty");
        model.addAttribute("notifications", notificationManager.getNotifications());
        return "redirect:/loginPage";
    }

    @GetMapping("/verifyEmail")
    public String verifyEmail(@RequestParam int user_id, @RequestParam String token) {
        User user = userService.findByVerificationTokenAndUserId(user_id, token);
        if (user == null) {
            notificationManager.sendFlashNotification("Invalid verification token/user_id !", "alert-danger", "short-noty");
            return "redirect:/loginPage";
        }

        if (user.getTokenExpiration().isBefore(LocalDateTime.now())) {
            notificationManager.sendFlashNotification("Verification token has expired, please re-signup !", "alert-danger", "short-noty");
            userService.DeleteUserById(user_id);
            return "signup-form";
        }

        user.setEnabled(true);
        tokenGenerationService.generateVerificationToken(user);
        notificationManager.sendFlashNotification("Your account is now verified, please login .", "alert-success", "short-noty");
        return "redirect:/loginPage";
    }

    @GetMapping("/verifyInviteUser")
    public String verifyChatJoin(@RequestParam String token, @RequestParam int type, @RequestParam int sender_id, @RequestParam int user_id, @RequestParam String groupName) {
        Token stored_token = tokenService.findByUserTokenAndType(sender_id, token, "invite");

        if (stored_token == null) {
            notificationManager.sendFlashNotification("Invalid verification token/user_id.", "alert-danger", "short-noty");
        }
        else if (stored_token.getExpire_at().isBefore(LocalDateTime.now())) {
            notificationManager.sendFlashNotification("Verification token has expired.", "alert-danger", "short-noty");
        }
        else{
            User user = userService.getUserById(user_id);
            List<Invite> invites = inviteService.getInvites(userService.getUserById(sender_id).getEmail(), user.getEmail(), type);
            for(Invite i:invites){
                i.setAccepted(true);
            }
            List<Invite> invites_other = inviteService.getInvites(user.getEmail(), userService.getUserById(sender_id).getEmail(), type);
            for(Invite i:invites_other){
                i.setAccepted(true);
            }
            tokenService.delete(stored_token.getId());
            notificationManager.sendFlashNotification("Chat join complete, please login!", "alert-success", "short-noty");

            // Check if user already exists in Firestore
            Firestore db = this.firestore;
            DocumentReference userRef = db.collection("Users").document(String.valueOf(user.getId()));
            ApiFuture<DocumentSnapshot> future = userRef.get();

            try {
                DocumentSnapshot document = future.get();
                if (!document.exists()) {
                    // Create a new user record in Firestore
                    Map<String, Object> userData = new HashMap<>();
                    userData.put("id", user.getId());
                    userData.put("email", user.getEmail());
                    userData.put("createdAt", LocalDateTime.now().toString());

                    // Add user to Firestore
                    userRef.set(userData);
                    System.out.println("New user created in Firestore.");
                } else {
                    System.out.println("User already exists in Firestore.");
                }
            } catch (Exception e) {
                e.printStackTrace();
            }

            // Check for sender's user record and create if not exists
            String senderEmail = userService.getUserById(sender_id).getEmail(); // Get sender's email
            DocumentReference senderRef = db.collection("Users").document(String.valueOf(sender_id));
            ApiFuture<DocumentSnapshot> senderFuture = senderRef.get();

            try {
                DocumentSnapshot senderDocument = senderFuture.get();
                if (!senderDocument.exists()) {
                    // Create sender user record in Firestore
                    Map<String, Object> senderData = new HashMap<>();
                    senderData.put("id", userService.getUserById(sender_id).getId());
                    senderData.put("email", senderEmail);
                    senderData.put("createdAt", LocalDateTime.now().toString());

                    // Add sender to Firestore
                    senderRef.set(senderData);
                    System.out.println("Sender user created in Firestore.");
                } else {
                    System.out.println("Sender user already exists in Firestore.");
                }
            } catch (Exception e) {
                e.printStackTrace();
            }

            // Proceed to create or check rooms
            createOrCheckRoom(type, sender_id, user_id, groupName);
        }
        return "redirect:/loginPage";
    }

    private void createOrCheckRoom(int type, int senderId, int recipient_id, String groupName) {
        Firestore db = this.firestore;
        String roomId;

        if (type == 0) { // Single chat
            roomId = "single_" + senderId + "_" + recipient_id; // Unique ID for single chat
            DocumentReference roomRef = db.collection("Rooms").document(roomId);
            ApiFuture<DocumentSnapshot> roomDocument = roomRef.get();

            try {
                DocumentSnapshot document = roomDocument.get();
                if (!document.exists()) {
                    // Create new room
                    Map<String, Object> roomData = new HashMap<>();
                    roomData.put("userIds", Arrays.asList(senderId, recipient_id)); // Store user IDs
                    roomData.put("name", ""); // No name for single chat
                    roomRef.set(roomData);
                    System.out.println("Single room created.");
                } else {
                    System.out.println("Single room already exists.");
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        } else if (type == 1) { // Group chat
            roomId = "group_" + groupName + "_" + senderId; // Use sender's ID as the room ID
            DocumentReference roomRef = db.collection("Rooms").document(roomId);
            ApiFuture<DocumentSnapshot> roomDocument = roomRef.get();

            try {
                DocumentSnapshot document = roomDocument.get();
                if (!document.exists()) {
                    // Create new group room
                    Map<String, Object> roomData = new HashMap<>();
                    roomData.put("userIds", Arrays.asList(senderId, recipient_id)); // Store user IDs
                    roomData.put("name", "Group Chat"); // Set a default name
                    roomRef.set(roomData);
                    System.out.println("Group room created.");
                } else {
                    List<Integer> userIds = (List<Integer>) document.get("userIds");
                    userIds.add(recipient_id); // Add recipient's user ID
                    roomRef.update("userIds", userIds);
                    System.out.println("Group room updated with new user.");
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    @GetMapping("/access-denied")
    public String deniedAccess(){
        return "access-denied";
    }
}