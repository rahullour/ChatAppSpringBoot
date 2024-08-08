package com.creating.chatApplication.service;

import com.creating.chatApplication.entity.User;

public interface UserService {
    User getUserByUsername(String username);
    User getUserByEmail(String email);
    void saveUser(User user);
}
