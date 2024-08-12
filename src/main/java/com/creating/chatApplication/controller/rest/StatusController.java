package com.creating.chatApplication.controller.rest;

import com.creating.chatApplication.service.StatusService;
import com.creating.chatApplication.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/status")
public class StatusController {

    @Autowired
    private StatusService statusService;

    @Autowired
    private UserService userService;


    @PostMapping
    public void setStatus(@RequestBody StatusRequest statusRequest, Principal principal) {
        // Assuming you have a method to get user ID from username
        int userId = userService.getUserByUsername(principal.getName()).getId();
        statusService.setStatus(userId, statusRequest.getStatusMessage());
    }

    // Inner class to handle request body
    public static class StatusRequest {
        private String statusMessage;

        public String getStatusMessage() {
            return statusMessage;
        }

        public void setStatusMessage(String statusMessage) {
            this.statusMessage = statusMessage;
        }
    }
}
