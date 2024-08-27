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

    @Column(name = "accepted")
    private boolean accepted;

    @Column(name = "type")
    private int type;

    public Invite() {
    }

    public Invite(String senderEmail, String recipientEmail, boolean accepted, int type, InviteGroup inviteGroup) {
        this.senderEmail = senderEmail;
        this.recipientEmail = recipientEmail;
        this.accepted = accepted;
        this.type = type;
    }

    public String getSenderEmail() {
        return senderEmail;
    }

    public void setSenderEmail(String senderEmail) {
        this.senderEmail = senderEmail;
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

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public void setRecipientEmail(String recipientEmail) {
        this.recipientEmail = recipientEmail;
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
                ", accepted=" + accepted +
                ", type=" + type +
                '}';
    }
}
