package com.creating.chatApplication.service;

import com.creating.chatApplication.entity.Authority;
import com.creating.chatApplication.entity.Token;
import com.creating.chatApplication.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class TokenGenerationService {

    @Autowired
    private UserService userService;

    @Autowired
    private TokenService tokenService;

    public String generateVerificationToken(User user) {
        String token = UUID.randomUUID().toString(); // Generate a unique token
        // Save the token in the database associated with the user
        user.setVerificationToken(token);
        user.setTokenExpiration(LocalDateTime.now().plusMinutes(5)); // Set expiration time
        userService.saveUser(user);
        return token;
    }

    public String generateToken(User user, String type) {
        String token = UUID.randomUUID().toString(); // Generate a unique token
        // Save the token in the database associated with the user
        tokenService.createToken(type, token, LocalDateTime.now().plusMinutes(5), user);
        return token;
    }
}
