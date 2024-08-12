package com.creating.chatApplication.service;

import com.creating.chatApplication.entity.User;

public interface UserService {
    User getUserById(int id);
    User getUserByUsername(String username);
    User getUserByEmail(String email);
    User getCurrentUser();
    void saveUser(User user);
    String getFCMTokenByEmail(String email);
    void saveFCMToken(String email, String token);
    User findByVerificationToken(String token);
}
