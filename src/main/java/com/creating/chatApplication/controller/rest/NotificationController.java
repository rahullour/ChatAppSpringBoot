package com.creating.chatApplication.controller.rest;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class NotificationController {

    private final SimpMessagingTemplate messagingTemplate;

    public NotificationController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @GetMapping("/send-notification")
    public void sendNotification(@RequestParam String roomId) {
        String message = "New messages in room: " + roomId;
        System.out.println("Sending notification: " + message);
        messagingTemplate.convertAndSend("/topic/notifications/" + roomId, message);
        System.out.println("Notification sent");
    }
}