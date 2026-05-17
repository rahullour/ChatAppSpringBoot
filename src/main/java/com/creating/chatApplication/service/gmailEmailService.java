package com.creating.chatApplication.service;

public interface gmailEmailService {
    public void sendEmail(String to, String subject, String bodyText);
    public String buildInviteEmailBody(String senderUsername, String senderEmail, String chatLink, String convType);
    public String buildVerificationEmailBody(String verificationLink);
    public String buildPasswordResetEmailBody(String verificationLink);
    public void sendInviteEmail(String to, String senderUsername, String senderEmail, String chatLink, Boolean type);
    public void sendVerificationEmail(String to, String verificationLink);
    public void sendPasswordResetEmail(String to, String verificationLink);
}
