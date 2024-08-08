package com.creating.chatApplication.service;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Component
public class NotificationManager {

    private static String notificationMessage;

    public static void sendFlashNotification(String message) {
        notificationMessage = message;
    }

    public static String getNotification() {
        return notificationMessage;
    }
}
