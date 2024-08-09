package com.creating.chatApplication.events;

import com.creating.chatApplication.service.NotificationManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.security.authentication.event.AuthenticationSuccessEvent;
import org.springframework.security.authentication.event.LogoutSuccessEvent;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.client.authentication.OAuth2LoginAuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;

import com.creating.chatApplication.entity.User;
import com.creating.chatApplication.service.UserDataService;
import com.creating.chatApplication.service.UserService;

import java.security.SecureRandom;
import java.util.Base64;

@Component
public class AuthenticationEvents {

    @Autowired
    private UserDataService userDataService;

    @Autowired
    private UserService userService;

    @Autowired
    private NotificationManager notificationManager;

    @EventListener
    public void onAuthenticationSuccess(Authentication authentication) {
        if (authentication instanceof OAuth2LoginAuthenticationToken) {
            OAuth2LoginAuthenticationToken oauthToken = (OAuth2LoginAuthenticationToken) authentication;
            OAuth2User oauthUser = oauthToken.getPrincipal();
            String email = oauthUser.getAttribute("email");
            logUserActivityByEmail(email, true);
            createUserIfNotPresent(email);
        } else if (authentication instanceof UsernamePasswordAuthenticationToken) {
            UsernamePasswordAuthenticationToken jdbcToken = (UsernamePasswordAuthenticationToken) authentication;
            UserDetails userDetails = (UserDetails) jdbcToken.getPrincipal();
            String email = userDetails.getUsername();
            logUserActivityByEmail(email, true);
        } else {
            System.out.println("Unsupported authentication type: " + authentication.getClass().getName());
        }
    }


    @EventListener
    public void onLogoutSuccess(LogoutSuccessEvent event) {
        Authentication authentication = event.getAuthentication();

        if (authentication instanceof OAuth2LoginAuthenticationToken) {
            OAuth2LoginAuthenticationToken oauthToken = (OAuth2LoginAuthenticationToken) authentication;
            OAuth2User oauthUser = oauthToken.getPrincipal();
            String email = oauthUser.getAttribute("email");
            logUserActivityByEmail(email, false);
        } else if (authentication instanceof UsernamePasswordAuthenticationToken) {
            UsernamePasswordAuthenticationToken jdbcToken = (UsernamePasswordAuthenticationToken) authentication;
            UserDetails userDetails = (UserDetails) jdbcToken.getPrincipal();
            String email = userDetails.getUsername();
            logUserActivityByEmail(email, false);
        } else {
            System.out.println("Unsupported authentication type: " + authentication.getClass().getName());
        }
    }



    private void logUserActivityByEmail(String email, boolean isLogin) {
        User user = userService.getUserByEmail(email);
        if (user != null) {
            if (isLogin) {
                userDataService.logUserLogin(user.getId());
            } else {
                userDataService.logUserLogout(user.getId());
            }
        }
    }
    private void createUserIfNotPresent(String email) {
        User existingUser = userService.getUserByEmail(email);
        if (existingUser == null) {
            String username = email.split("@")[0];
            String password = generateRandomPassword();

            User newUser = new User();
            newUser.setUsername(username);
            newUser.setEmail(email);
            newUser.setPassword(new BCryptPasswordEncoder().encode(password));
            newUser.setEnabled("1");

            userService.saveUser(newUser);

            String notificationMessage = "New User Created. If you wish to login without third-party APIs, your default password is: " + password;
            notificationManager.sendFlashNotification(notificationMessage); // Use NotificationManager to handle flash messages
        }
    }

    private String generateRandomPassword() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[10];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
