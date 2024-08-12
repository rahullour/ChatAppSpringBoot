package com.creating.chatApplication.service;

import com.creating.chatApplication.entity.User;
import com.creating.chatApplication.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl implements UserService{

    @Autowired
    private UserRepository userRepository;

    @Override
    public User getUserById(int id) {
        return userRepository.findById(id).orElse(null); // Return null if not found
    }

    @Override
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Override
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public void saveUser(User user) {
        userRepository.save(user);
    }

    @Override
    public String getFCMTokenByEmail(String email) {
        User user = userRepository.findByEmail(email);
        return user != null ? user.getFcmToken() : null; // Assuming you have a field for FCM token
    }

    @Override
    public void saveFCMToken(String email, String token) {
        User user = userRepository.findByEmail(email);
        if (user != null) {
            user.setFcmToken(token); // Assuming you have a method to set the FCM token
            userRepository.save(user);
        }
    }

    @Override
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            String username = authentication.getName(); // Get the username of the authenticated user
            return getUserByUsername(username); // Retrieve the User entity by username
        }
        return null; // Return null if no user is authenticated
    }

    @Override
    public User findByVerificationToken(String token) {
        // Logic to find the user by token
        return userRepository.findByVerificationToken(token);
    }

    @Override
    public User findByVerificationTokenAndUserId(int user_id, String token) {
        User userbytoken = userRepository.findByVerificationToken(token);
        User userbyid = userRepository.findById(user_id).orElse(null);;
        return  userbytoken != null && userbyid != null ? userbyid : null;
    }

}
