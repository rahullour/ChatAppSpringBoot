package com.creating.chatApplication.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendInviteEmail(String to, String senderUsername, String chatLink, Boolean type) {
        String subject = "WeChat Invitation";
        String convType = type == true ? "group" : "";
        String body = buildInviteEmailBody(senderUsername, chatLink, convType);

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");
            helper.setText(body, true); // This line sets the email content as HTML
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setFrom("WeChat");

            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            e.printStackTrace();
        }
    }

    private String buildInviteEmailBody(String senderUsername, String chatLink, String convType) {
        return "<!DOCTYPE html>\n" +
                "<html lang=\"en\">\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "    <title>WeChat Invitation</title>\n" +
                "    <style>\n" +
                "        body {\n" +
                "            font-family: Arial, sans-serif;\n" +
                "            line-height: 1.6;\n" +
                "            color: #333;\n" +
                "            max-width: 600px;\n" +
                "            margin: 0 auto;\n" +
                "            padding: 20px;\n" +
                "            background-color: #f4f4f4;\n" +
                "        }\n" +
                "        .container {\n" +
                "            background-color: #ffffff;\n" +
                "            border-radius: 8px;\n" +
                "            padding: 30px;\n" +
                "            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);\n" +
                "        }\n" +
                "        h1 {\n" +
                "            color: #ff881d;\n" +
                "            margin-top: 0;\n" +
                "        }\n" +
                "        .ii a[href] {\n" +
                "        color: #fff;\n" +
                "    }\n" +
                "        .button {\n" +
                "            display: inline-block;\n" +
                "            background-color: #ff881d;\n" +
                "            color: white;\n" +
                "            padding: 12px 24px;\n" +
                "            text-decoration: none;\n" +
                "            border-radius: 5px;\n" +
                "            font-weight: bold;\n" +
                "            margin-top: 20px;\n" +
                "        }\n" +
                "        .footer {\n" +
                "            margin-top: 30px;\n" +
                "            text-align: center;\n" +
                "            font-size: 0.9em;\n" +
                "            color: #666;\n" +
                "        }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"container\">\n" +
                "        <h1>You're Invited to WeChat!</h1>\n" +
                "        <p>Hello,</p>\n" +
                "        <p>You've been invited to join a " + convType + " conversation by <strong>" + senderUsername + "</strong>. We're excited to have you connect!</p>\n" +
                "        <p>To join the conversation, simply click the button below:</p>\n" +
                "        <a href=\"" + chatLink + "\" class=\"button\">Join the Chat</a>\n" +
                "        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>\n" +
                "        <p>" + chatLink + "</p>\n" +
                "        <p>We look forward to seeing you in the chat!</p>\n" +
                "        <p>Best regards,<br>WeChat Team</p>\n" +
                "        <div class=\"footer\">\n" +
                "            <p>This invitation was sent by " + senderUsername + ". If you didn't expect this invitation, please disregard this email.</p>\n" +
                "        </div>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }

    public void sendVerificationEmail(String to, String verificationLink) {
        String subject = "WeChat Invitation";
        String body = buildVerificationEmailBody(verificationLink);

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");
            helper.setText(body, true); // This line sets the email content as HTML
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setFrom("WeChat");

            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            e.printStackTrace();
        }
    }

    public void sendPasswordResetEmail(String to, String verificationLink) {
        String subject = "WeChat Password Reset";
        String body = buildPasswordResetEmailBody(verificationLink);

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");
            helper.setText(body, true); // This line sets the email content as HTML
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setFrom("WeChat");

            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            e.printStackTrace();
        }
    }

    private String buildPasswordResetEmailBody(String verificationLink) {
        return "<!DOCTYPE html>\n" +
                "<html lang=\"en\">\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "    <title>WeChat Signup Verification</title>\n" +
                "    <style>\n" +
                "        body {\n" +
                "            font-family: Arial, sans-serif;\n" +
                "            line-height: 1.6;\n" +
                "            color: #333;\n" +
                "            max-width: 600px;\n" +
                "            margin: 0 auto;\n" +
                "            padding: 20px;\n" +
                "            background-color: #f4f4f4;\n" +
                "        }\n" +
                "        .container {\n" +
                "            background-color: #ffffff;\n" +
                "            border-radius: 8px;\n" +
                "            padding: 30px;\n" +
                "            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);\n" +
                "        }\n" +
                "        h1 {\n" +
                "            color: #ff881d;\n" +
                "            margin-top: 0;\n" +
                "        }\n" +
                "        .button {\n" +
                "            display: inline-block;\n" +
                "            background-color: #ff881d;\n" +
                "            color: white;\n" +
                "            padding: 12px 24px;\n" +
                "            text-decoration: none;\n" +
                "            border-radius: 5px;\n" +
                "            font-weight: bold;\n" +
                "            margin-top: 20px;\n" +
                "        }\n" +
                "        .footer {\n" +
                "            margin-top: 30px;\n" +
                "            text-align: center;\n" +
                "            font-size: 0.9em;\n" +
                "            color: #666;\n" +
                "        }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"container\">\n" +
                "        <h1>Welcome to WeChat!</h1>\n" +
                "        <p>Hello,</p>\n" +
                "        <p>We have received a password request for you account, please click the button below to reset your account password:</p>\n" +
                "        <a href=\"" + verificationLink + "\" class=\"button\">Reset Password</a>\n" +
                "        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>\n" +
                "        <p>" + verificationLink + "</p>\n" +
                "        <p>Please ignore this email if not requested by you.</p>\n" +
                "        <p>If you have any questions or need further assistance, please don't hesitate to contact us at wechatcorporations@gmail.com.</p>\n" +
                "        <p>Best regards,<br>WeChat Team</p>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }

    private String buildVerificationEmailBody(String verificationLink) {
        return "<!DOCTYPE html>\n" +
                "<html lang=\"en\">\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "    <title>WeChat Signup Verification</title>\n" +
                "    <style>\n" +
                "        body {\n" +
                "            font-family: Arial, sans-serif;\n" +
                "            line-height: 1.6;\n" +
                "            color: #333;\n" +
                "            max-width: 600px;\n" +
                "            margin: 0 auto;\n" +
                "            padding: 20px;\n" +
                "            background-color: #f4f4f4;\n" +
                "        }\n" +
                "        .container {\n" +
                "            background-color: #ffffff;\n" +
                "            border-radius: 8px;\n" +
                "            padding: 30px;\n" +
                "            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);\n" +
                "        }\n" +
                "        h1 {\n" +
                "            color: #ff881d;\n" +
                "            margin-top: 0;\n" +
                "        }\n" +
                "        .button {\n" +
                "            display: inline-block;\n" +
                "            background-color: #ff881d;\n" +
                "            color: white;\n" +
                "            padding: 12px 24px;\n" +
                "            text-decoration: none;\n" +
                "            border-radius: 5px;\n" +
                "            font-weight: bold;\n" +
                "            margin-top: 20px;\n" +
                "        }\n" +
                "        .footer {\n" +
                "            margin-top: 30px;\n" +
                "            text-align: center;\n" +
                "            font-size: 0.9em;\n" +
                "            color: #666;\n" +
                "        }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"container\">\n" +
                "        <h1>Welcome to WeChat!</h1>\n" +
                "        <p>Hello,</p>\n" +
                "        <p>Thank you for signing up for WeChat. To complete your registration, please click the button below to verify your email address:</p>\n" +
                "        <a href=\"" + verificationLink + "\" class=\"button\">Verify Email</a>\n" +
                "        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>\n" +
                "        <p>" + verificationLink + "</p>\n" +
                "        <p>Once your email is verified, you'll be able to start chatting with your friends and family on WeChat.</p>\n" +
                "        <p>If you have any questions or need further assistance, please don't hesitate to contact us at wechatcorporations@gmail.com.</p>\n" +
                "        <p>Best regards,<br>WeChat Team</p>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }
}