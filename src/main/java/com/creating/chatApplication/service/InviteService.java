package com.creating.chatApplication.service;

import com.creating.chatApplication.entity.Invite;

import java.util.List;

public interface InviteService {
    void sendInvite(String senderUsername, String recipientEmail);
    List<Invite> getInvitesForReciever(String email);
    void acceptInvite(int inviteId, String username);
    void rejectInvite(int inviteId, String username);
}
