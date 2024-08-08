package com.creating.chatApplication.service;

import org.springframework.security.core.userdetails.UserDetails;

public interface UserDataService {
    void logUserLogin(int user_id);
    void logUserLogout(int user_id);
}