package com.creating.chatApplication.service;

import com.creating.chatApplication.entity.Invite;

import java.util.List;

public interface InviteService {
    Invite createInvite(String senderUsername, String recipientEmail, int type);
    List<Invite> getInvites(String s_email, String r_email);
    List<Invite> getInvitesForReciever(String email);
    void acceptInvite(int inviteId, String username);
    void rejectInvite(int inviteId);
}
