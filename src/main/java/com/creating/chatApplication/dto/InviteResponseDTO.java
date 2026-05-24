package com.creating.chatApplication.dto;

import com.creating.chatApplication.entity.Invite;

public class InviteResponseDTO {
    private Invite invite;
    private String statusMessage;

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public int getUserId() {
        return userId;
    }

    public void setUserId(int userId) {
        this.userId = userId;
    }

    private String userName;
    private int userId;

    public InviteResponseDTO(Invite invite, String statusMessage, String userName, int userId) {
        this.invite = invite;
        this.statusMessage = statusMessage;
        this.userName = userName;
        this.userId = userId;
    }

    // Getters and Setters
    public Invite getInvite() { return invite; }
    public void setInvite(Invite invite) { this.invite = invite; }
    public String getStatusMessage() { return statusMessage; }
    public void setStatusMessage(String statusMessage) { this.statusMessage = statusMessage; }
}