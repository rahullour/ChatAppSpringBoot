package com.creating.chatApplication.events;

import com.creating.chatApplication.service.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
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
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.io.IOException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Component
public class AuthenticationEvents {

    @Autowired
    private UserDataService userDataService;

    @Autowired
    private UserService userService;

    @Autowired
    private NotificationManager notificationManager;
    private TokenGenerationService tokenGenerationService;


    @EventListener
    public void onAuthenticationSuccess(AuthenticationSuccessEvent event) {
        Authentication authentication = event.getAuthentication();

        if (authentication instanceof OAuth2LoginAuthenticationToken) {
            OAuth2LoginAuthenticationToken oauthToken = (OAuth2LoginAuthenticationToken) authentication;
            OAuth2User oauthUser = oauthToken.getPrincipal();
            String email = oauthUser.getAttribute("email");
            createUserIfNotPresent(email);
            logUserActivityByEmail(email, true);
            handleUserAuthentication(email);
            String notificationMessage = "Welcome " + userService.getUserByEmail(email).getUsername();
            notificationManager.sendFlashNotification(notificationMessage, "short-noty");
        } else if (authentication instanceof UsernamePasswordAuthenticationToken) {
            UsernamePasswordAuthenticationToken jdbcToken = (UsernamePasswordAuthenticationToken) authentication;
            Object principal = jdbcToken.getPrincipal();

            if (principal instanceof CustomUserDetails) {
                CustomUserDetails userDetails = (CustomUserDetails) principal;
                String email = userDetails.getEmail();

                if (email != null) {
                    System.out.println("Email retrieved: " + email);
                    logUserActivityByEmail(email, true);
                    handleUserAuthentication(email);
                    String notificationMessage = "Welcome " + userService.getUserByEmail(email).getUsername();
                    notificationManager.sendFlashNotification(notificationMessage, "short-noty");
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

    private void handleUserAuthentication(String email) {
        User user = userService.getUserByEmail(email);
        if (user != null) {
            if (!user.isEnabled()) {
                // Log out the user and notify them
                System.out.println("User account is disabled. Logging out.");
                String notificationMessage = "Your account is disabled for now, please contact admin support @rahullour01@gmail.com.";
                notificationManager.sendFlashNotification(notificationMessage, "medium-noty");
                HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes()).getRequest();
                HttpServletResponse response = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes()).getResponse();

                try {
                    // Perform logout by redirecting to the logout URL
                    response.sendRedirect(request.getContextPath() + "/logout");
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        } else {
            System.out.println("User not found for email: " + email);
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
            createUserIfNotPresent(email);
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

            User newUser = new User(username, email, new BCryptPasswordEncoder().encode(password), true, "aeseud", LocalDateTime.now());
            userService.saveUser(newUser);

            String notificationMessage = "New User Created. If you wish to login without third-party APIs, your default password is: " + password + " , please save it somewhere. ";
            notificationManager.sendFlashNotification(notificationMessage, "long-noty");
        }
    }

    private String generateRandomPassword() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[10];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
