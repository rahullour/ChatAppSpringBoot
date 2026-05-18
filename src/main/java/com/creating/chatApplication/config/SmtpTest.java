package com.creating.chatApplication.config;
import org.junit.jupiter.api.Test;
import java.util.Properties;
import jakarta.mail.*;
import jakarta.mail.internet.*;

public class SmtpTest {

    @Test
    public void testGmailConnection() {
        String username = "wechatcorporations@gmail.com";
        // Test it BOTH ways here: 1) "xxxx xxxx xxxx xxxx" and 2) "xxxxxxxxxxxxxxxx"
        String appPassword = "xxxx xxxx xxxx xxxx";

        Properties prop = new Properties();
        prop.put("mail.smtp.host", "smtp.gmail.com");
        prop.put("mail.smtp.port", "587");
        prop.put("mail.smtp.auth", "true");
        prop.put("mail.smtp.starttls.enable", "true");

        Session session = Session.getInstance(prop, new jakarta.mail.Authenticator() {
            @Override
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(username, appPassword);
            }
        });

        try {
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(username));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(username));
            message.setSubject("SMTP Test");
            message.setText("If you see this, your App Password is 100% working!");

            System.out.println("Attempting connection to Google SMTP...");
            Transport.send(message);
            System.out.println("SUCCESS! Mail sent perfectly.");

        } catch (MessagingException e) {
            System.out.println("CRITICAL FAILURE: Google rejected the connection.");
            e.printStackTrace();
        }
    }
}