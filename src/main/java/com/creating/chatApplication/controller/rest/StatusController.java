package com.creating.chatApplication.controller.rest;

import com.creating.chatApplication.dto.StatusDTO;
import com.creating.chatApplication.entity.Invite;
import com.creating.chatApplication.entity.Status;
import com.creating.chatApplication.service.NotificationManager;
import com.creating.chatApplication.service.StatusService;
import com.creating.chatApplication.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api")
public class StatusController {

    @Autowired
    private NotificationManager notificationManager;

    @Autowired
    private StatusService statusService;

    @Autowired
    private UserService userService;

    @PostMapping("/status")
        public ResponseEntity<Void> setStatus(@RequestParam String statusSelect, @RequestParam(required = false) String customStatus) {
        if(Objects.equals(statusSelect, "Custom")){
            statusSelect = customStatus;
        }
        statusService.setStatus(userService.getCurrentUser().getId(), statusSelect);
        notificationManager.sendFlashNotification("New status is set.", "alert-success", "short-noty");
        return ResponseEntity.status(HttpStatus.FOUND)
                .header("Location", "/")
                .build();
    }

    @GetMapping("/myStatus")
    public StatusDTO getStatus(){
        return statusService.getStatusOnlyForUser(userService.getCurrentUser().getId());
    }
}
