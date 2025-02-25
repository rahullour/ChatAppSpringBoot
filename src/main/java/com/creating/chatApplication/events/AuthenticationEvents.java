package com.creating.chatApplication.events;

import com.creating.chatApplication.entity.Authority;
import com.creating.chatApplication.repository.ThemeRepository;
import com.creating.chatApplication.service.*;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.security.authentication.event.LogoutSuccessEvent;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.event.AuthenticationSuccessEvent;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.client.authentication.OAuth2LoginAuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;
import com.creating.chatApplication.entity.User;

import java.awt.*;
import java.awt.datatransfer.Clipboard;
import java.awt.datatransfer.StringSelection;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class AuthenticationEvents {

    @Autowired
    private UserDataService userDataService;

    @Autowired
    private UserService userService;

    @Autowired
    private Firestore firestore;

    @Autowired
    private NotificationManager notificationManager;
    private TokenGenerationService tokenGenerationService;

    @Autowired
    private ThemeRepository themeRepository;

    @EventListener
    public void onAuthenticationSuccess(AuthenticationSuccessEvent event) {
        Authentication authentication = event.getAuthentication();

        if (authentication instanceof OAuth2LoginAuthenticationToken) {
            OAuth2LoginAuthenticationToken oauthToken = (OAuth2LoginAuthenticationToken) authentication;
            OAuth2User oauthUser = oauthToken.getPrincipal();
            String email = oauthUser.getAttribute("email");
            createUserIfNotPresent(email);
            logUserActivityByEmail(email, true);
            String notificationMessage = "Welcome " + userService.getUserByEmail(email).getUsername();
            notificationManager.sendFlashNotification(notificationMessage, "alert-success", "short-noty");
        } else if (authentication instanceof UsernamePasswordAuthenticationToken) {
            UsernamePasswordAuthenticationToken jdbcToken = (UsernamePasswordAuthenticationToken) authentication;
            Object principal = jdbcToken.getPrincipal();

            if (principal instanceof CustomUserDetails) {
                CustomUserDetails userDetails = (CustomUserDetails) principal;
                String email = userDetails.getEmail();

                if (email != null) {
                    System.out.println("Email retrieved: " + email);
                    logUserActivityByEmail(email, true);
                    String notificationMessage = "Welcome " + userService.getUserByEmail(email).getUsername();
                    notificationManager.sendFlashNotification(notificationMessage, "alert-success", "short-noty");
                } else {
                    System.out.println("Email is null in CustomUserDetails");
                }
            } else {
                System.out.println("Principal is not an instance of CustomUserDetails");
            }
        } else {
            System.out.println("Unsupported authentication type: " + authentication.getClass().getName());
        }
    }


    @EventListener
    public void onLogoutSuccess(LogoutSuccessEvent event) {
        Authentication authentication = event.getAuthentication();

        if (authentication == null) {
            System.out.println("Authentication is null");
            return;
        }

        System.out.println("Authentication type: " + authentication.getClass().getName());

        if (authentication instanceof OAuth2AuthenticationToken) {
            OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
            OAuth2User oauthUser = oauthToken.getPrincipal();
            String email = oauthUser.getAttribute("email");
            logUserActivityByEmail(email, false);
        } else if (authentication instanceof UsernamePasswordAuthenticationToken) {

                if (authentication == null) {
                    System.out.println("Authentication is null");
                    return;
                }

                System.out.println("Authentication type: " + authentication.getClass().getName());

                if (authentication instanceof UsernamePasswordAuthenticationToken) {
                    UsernamePasswordAuthenticationToken jdbcToken = (UsernamePasswordAuthenticationToken) authentication;
                    Object principal = jdbcToken.getPrincipal();

                    if (principal instanceof CustomUserDetails) {
                        CustomUserDetails userDetails = (CustomUserDetails) principal;
                        String email = userDetails.getEmail();

                        if (email != null) {
                            System.out.println("Email retrieved: " + email);
                            logUserActivityByEmail(email, false);
                        } else {
                            System.out.println("Email is null in CustomUserDetails");
                        }
                    } else {
                        System.out.println("Principal is not an instance of CustomUserDetails");
                    }
                } else {
                    System.out.println("Unsupported authentication type: " + authentication.getClass().getName());
                }

        } else {
            System.out.println("Unsupported authentication type: " + authentication.getClass().getName());
        }
    }


    private void logUserActivityByEmail(String email, boolean isLogin) {
        System.out.println("Attempting to log activity for email: " + email);
        User user = userService.getUserByEmail(email);
        if (user != null) {
            System.out.println("User found with ID: " + user.getId());
            if (isLogin) {
                System.out.println("Logging login for user ID: " + user.getId());
                userDataService.logUserLogin(user.getId());
            } else {
                System.out.println("Logging logout for user ID: " + user.getId());
                userDataService.logUserLogout(user.getId());
            }
            System.out.println("Activity logged successfully");
        } else {
            System.out.println("User not found for email: " + email);
        }
    }



    private void createUserIfNotPresent(String email) {
        User existingUser = userService.getUserByEmail(email);
        if (existingUser == null) {
            String username = email.split("@")[0];
            String password = generateRandomPassword();
            String profileImageUrl = convertImageToBase64("src/main/resources/static/images/profile-image.png");
            User newUser = new User(username, email, new BCryptPasswordEncoder().encode(password), true, "afio123deseud", LocalDateTime.now(), profileImageUrl);
            Authority userAuthority = new Authority("ROLE_USER");
            userAuthority.setUser(newUser);
            List<Authority> authorities = new ArrayList<>();
            authorities.add(userAuthority);
            newUser.setAuthorities(authorities);
            newUser.setTheme(themeRepository.findById(1).orElse(null));
            newUser.setEnabled(true);
            User user = userService.saveUser(newUser);
            String notificationMessage = "Account created successfully !";
            notificationManager.sendFlashNotification(notificationMessage, "alert-success", "short-noty");
            notificationMessage = "A temporary password has been generated. Please save it locally if you wish to login again normally !";
            notificationManager.sendFlashNotification(notificationMessage, "alert-danger", "long-noty");
            notificationMessage = "Password: "+password;
            notificationManager.sendFlashNotification(notificationMessage, "alert-success", "long-noty");
        }
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

    private String generateRandomPassword() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[10];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
