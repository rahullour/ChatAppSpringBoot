package com.creating.chatApplication.service;

import com.creating.chatApplication.entity.Invite;
import com.creating.chatApplication.entity.InviteGroup;

import java.util.List;

public interface InviteService {
    Invite createInvite(String senderUsername, String recipientEmail, int type, InviteGroup inviteGroup);
    List<Invite> getInvites(String s_email, String r_email, int type);
    List<Invite> getInvitesBySenderEmail(String s_email, int type);
    List<Invite> getInvitesBySenderEmailAccepted(String s_email, int type);
    List<Invite> getInvitesBySenderOrRecieverEmailAccepted(String email, int type);
    void acceptInvite(int inviteId, String username);
    void rejectInvite(int inviteId);
    Invite saveInvite(Invite invite);
}
