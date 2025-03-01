package com.creating.chatApplication.controller.rest;

import com.creating.chatApplication.entity.User;
import com.creating.chatApplication.entity.UserData;
import com.creating.chatApplication.service.UserDataService;
import com.creating.chatApplication.service.UserService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RequestMapping("/api/userdata")
@RestController
public class UserDataController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserDataService userDataService;

    // Use native query with EntityManager to bypass repository issues
    @PersistenceContext
    private EntityManager entityManager;

    @GetMapping("/login-history")
    public List<Map<String, Object>> getLoginHistory() {
        User currentUser = userService.getCurrentUser();
        List<UserData> loginHistory = userDataService.getLoginHistory(currentUser.getId());

        // Create a list of simplified maps with only the fields you want
        List<Map<String, Object>> simplifiedData = new ArrayList<>();

        for (UserData data : loginHistory) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("createdAt", data.getCreatedAt());
            entry.put("type", data.getType());
            simplifiedData.add(entry);
        }

        return simplifiedData;
    }
}