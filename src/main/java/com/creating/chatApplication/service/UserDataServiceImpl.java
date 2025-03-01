package com.creating.chatApplication.service;

import com.creating.chatApplication.repository.UserDataRepository;
import com.creating.chatApplication.entity.User;
import com.creating.chatApplication.entity.UserData;
import com.creating.chatApplication.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class UserDataServiceImpl implements UserDataService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserDataRepository userDataRepository;

    @Transactional
    @Override
    public void logUserLogin(int userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            UserData userData = new UserData("Login", LocalDateTime.now());
            userData.setUser(user);
            userDataRepository.save(userData);
        }
    }

    @Transactional
    @Override
    public void logUserLogout(int userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            UserData userData = new UserData("Logout", LocalDateTime.now());
            userData.setUser(user);
            userDataRepository.save(userData);
        }
    }

    public UserDataRepository getUserDataRepository() {
        return userDataRepository;
    }

    public List<UserData> getLoginHistory(int userId) {
        return userDataRepository.findLoginHistoryByUserId(userId);
    }
}