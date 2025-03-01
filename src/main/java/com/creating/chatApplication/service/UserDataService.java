package com.creating.chatApplication.service;

import com.creating.chatApplication.entity.UserData;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;

public interface UserDataService {
    void logUserLogin(int user_id);
    void logUserLogout(int user_id);
    List<UserData> getLoginHistory(int user_id);
}