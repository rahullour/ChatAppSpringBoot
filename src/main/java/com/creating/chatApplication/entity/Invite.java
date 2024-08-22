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

    @Column(name = "accepted")
    private boolean accepted;

    @Column(name = "type")
    private int type;

    public Invite() {
    }

    public Invite(String senderEmail, String recipientEmail, LocalDateTime createdAt, boolean accepted, int type, InviteGroup inviteGroup) {
        this.senderEmail = senderEmail;
        this.recipientEmail = recipientEmail;
        this.createdAt = createdAt;
        this.accepted = accepted;
        this.type = type;
        this.inviteGroup = inviteGroup;
    }

    @OneToOne(mappedBy = "invite", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private InviteGroup inviteGroup;

    public InviteGroup getInviteGroup() {
        return inviteGroup;
    }

    public void setInviteGroup(InviteGroup inviteGroup) {
        this.inviteGroup = inviteGroup;
    }

    public String getSenderEmail() {
        return senderEmail;
    }

    public void setSenderEmail(String senderEmail) {
        this.senderEmail = senderEmail;
    }

    public int isType() {
        return type;
    }

    public void setType(int type) {
        this.type = type;
    }

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
                ", type=" + type +
                ", inviteGroup=" + inviteGroup +
                '}';
    }
}
