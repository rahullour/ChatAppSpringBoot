package com.creating.chatApplication.service;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.model.Message;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.UserCredentials;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.apache.commons.codec.binary.Base64;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.Properties;

@Service
public class GmailEmailServiceImpl implements gmailEmailService {

    @Value("${google.gmail.refresh-token}")
    private String refreshToken;

    @Value("${google.gmail.sender-email}")
    private String fromEmail;

    @Value("${google.oauth.config.path}")
    private String googleOAuthConfigPath;

    @Autowired
    private ResourceLoader resourceLoader;

    private Gmail getGmailService() throws Exception {
        // 1. Leverages your injected ResourceLoader dynamically using the properties path
        Resource resource = resourceLoader.getResource(googleOAuthConfigPath);

        // 2. Parse the stream natively via Google's library structure
        GoogleClientSecrets clientSecrets = GoogleClientSecrets.load(
                GsonFactory.getDefaultInstance(),
                new InputStreamReader(resource.getInputStream())
        );

        // 3. Assemble application client identity with the permanent refresh token
        UserCredentials credentials = UserCredentials.newBuilder()
                .setClientId(clientSecrets.getDetails().getClientId())
                .setClientSecret(clientSecrets.getDetails().getClientSecret())
                .setRefreshToken(refreshToken)
                .build();

        return new Gmail.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                GsonFactory.getDefaultInstance(),
                new HttpCredentialsAdapter(credentials))
                .setApplicationName("WeChat-App")
                .build();
    }

    @Override
    public void sendEmail(String to, String subject, String bodyText) {
        try {
            Gmail service = getGmailService();

            // 3. Construct a standard Jakarta Mail message (retaining your original helper logic)
            Properties props = new Properties();
            Session session = Session.getDefaultInstance(props, null);
            MimeMessage message = new MimeMessage(session);

            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom("WeChat <" + fromEmail + ">");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(bodyText, true); // Retains HTML rendering support

            // 4. Encode the mime message to Base64url format for the web API payload
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            message.writeTo(buffer);
            String encodedEmail = Base64.encodeBase64URLSafeString(buffer.toByteArray());

            Message gmailMessage = new Message().setRaw(encodedEmail);

            // 5. Fire via standard HTTP REST API (Port 443)
            service.users().messages().send("me", gmailMessage).execute();
            System.out.println("Email successfully sent via Gmail API to: " + to);

        } catch (Exception e) {
            System.err.println("Failed to send email via Gmail API: " + e.getMessage());
            e.printStackTrace();
        }
    }


    public String buildInviteEmailBody(String senderUsername, String senderEmail, String chatLink, String convType) {
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
                "        .button {\n" +
                "            display: inline-block;\n" +
                "            background-color: #ff881d;\n" +
                "            color: white !important;\n" +
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
                "        <p>You've been invited to join a " + convType + " conversation by <strong>" + senderUsername + "</strong>, email: " + senderEmail + ".</p>\n" +
                "        <p>Do invite " + senderEmail + " after login if this mail came before your account verification!</p>\n" +
                "        <a href=\"" + chatLink + "\" data-tracking=\"false\" iterable=\"false\" class=\"button\">Join the Chat</a>\n" +
                "        <p>We look forward to seeing you in the chat!</p>\n" +
                "        <p>Best regards,<br>WeChat Team</p>\n" +
                "        <div class=\"footer\">\n" +
                "            <p>This invitation was sent by " + senderUsername + ". If you didn't expect this invitation, please disregard this email.</p>\n" +
                "        </div>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }

    public String buildVerificationEmailBody(String verificationLink) {
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
                "            color: white !important;\n" +
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
                "        <a href=\"" + verificationLink + "\" data-tracking=\"false\" iterable=\"false\" class=\"button\">Verify Email</a>\n" +
                "        <p>Once your email is verified, you'll be able to start chatting with your friends and family on WeChat.</p>\n" +
                "        <p>If you have any questions or need further assistance, please don't hesitate to contact us at wechatcorporations@gmail.com.</p>\n" +
                "        <p>Best regards,<br>WeChat Team</p>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }

    public String buildPasswordResetEmailBody(String verificationLink) {
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
                "            color: white !important;\n" +
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
                "        <p>We have received a password request for your account, please click the button below to reset your account password:</p>\n" +
                "        <a href=\"" + verificationLink + "\" data-tracking=\"false\" iterable=\"false\" class=\"button\">Reset Password</a>\n" +
                "        <p>Please ignore this email if not requested by you.</p>\n" +
                "        <p>If you have any questions or need further assistance, please don't hesitate to contact us at wechatcorporations@gmail.com.</p>\n" +
                "        <p>Best regards,<br>WeChat Team</p>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }

    public void sendInviteEmail(String to, String senderUsername, String senderEmail, String chatLink, Boolean type) {
        String subject = "WeChat Invitation";
        String convType = type == true ? "group" : "";
        String body = buildInviteEmailBody(senderUsername, senderEmail, chatLink, convType);
        sendEmail(to, subject, body);
    }

    public void sendVerificationEmail(String to, String verificationLink) {
        String subject = "WeChat Verification";
        String body = buildVerificationEmailBody(verificationLink);
        sendEmail(to, subject, body);
    }

    public void sendPasswordResetEmail(String to, String verificationLink) {
        String subject = "WeChat Password Reset";
        String body = buildPasswordResetEmailBody(verificationLink);
        sendEmail(to, subject, body);
    }
}