package com.creating.chatApplication.service;

import com.creating.chatApplication.entity.User;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

@Component
public class NotificationManager {

    @Autowired
    private static UserService userService;

    @Autowired
    private JavaMailSender mailSender; // Inject JavaMailSender

    private static String notificationMessage;
    private static String notificationType;

    public static void sendFlashNotification(String message, String type) {
        notificationMessage = message;
        notificationType = type;
    }

    public static String getNotification() {
        return notificationMessage;
    }

    public static String getNotificationType() {
        return notificationType;
    }

    public static void clearNotification() {
        notificationMessage = null;
        notificationType = null;
    }

    public void sendInviteNotification(String recipientEmail, String token) {
        User currentUser = userService.getCurrentUser();
        if (currentUser != null) {
            String senderUsername = currentUser.getUsername();
            String chatLink = "localhost:8080"; // Replace with actual chat link
            String emailContent = getEmailTemplate(senderUsername, chatLink);

            // Create and send the email
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(recipientEmail);
            message.setSubject("You have a new chat invitation!");
            message.setText(emailContent);
            message.setFrom("your-email@example.com"); // Replace with your email

            mailSender.send(message); // Use JavaMailSender to send the email
            System.out.println("Invitation email sent successfully!");

        } else {
            System.out.println("No authenticated user found.");
        }
    }

    private String getEmailTemplate(String senderUsername, String chatLink) {
        StringBuilder emailTemplate = new StringBuilder();

        // Read the HTML template from the invite.html file
        try (InputStream inputStream = getClass().getResourceAsStream("/invite.html");
             BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                emailTemplate.append(line).append("\n");
            }
        } catch (IOException e) {
            e.printStackTrace();
        }

        // Replace placeholders in the HTML template
        String template = emailTemplate.toString();
        template = template.replace("{{senderUsername}}", senderUsername);
        template = template.replace("{{chatLink}}", chatLink);
        return template;
    }

    public void sendInviteNotification(String title, String body, String token) {
        // Firebase notification logic (unchanged)
        Notification notification = Notification.builder()
                .setTitle(title)
                .setBody(body)
                .build();

        Message message = Message.builder()
                .setNotification(notification)
                .setToken(token)
                .build();

        try {
            String response = FirebaseMessaging.getInstance().send(message);
            System.out.println("Successfully sent message: " + response);
        } catch (FirebaseMessagingException e) {
            e.printStackTrace();
        }
    }
}
