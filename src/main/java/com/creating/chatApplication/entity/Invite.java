package com.creating.chatApplication.entity;

import jakarta.persistence.*;
import java.util.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "invite")
public class Invite {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name = "sender_email")
    private String senderEmail;

    @Column(name = "recipient_email")
    private String recipientEmail;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    private boolean accepted;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getsenderEmail() {
        return senderEmail;
    }

    public void setsenderEmail(String senderEmail) {
        this.senderEmail = senderEmail;
    }

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public void setRecipientEmail(String recipientEmail) {
        this.recipientEmail = recipientEmail;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isAccepted() {
        return accepted;
    }

    public void setAccepted(boolean accepted) {
        this.accepted = accepted;
    }

    @Override
    public String toString() {
        return "Invite{" +
                "id=" + id +
                ", senderEmail='" + senderEmail + '\'' +
                ", recipientEmail='" + recipientEmail + '\'' +
                ", createdAt=" + createdAt +
                ", accepted=" + accepted +
                '}';
    }
}
