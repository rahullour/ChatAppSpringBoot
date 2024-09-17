package com.creating.chatApplication.service;

import com.creating.chatApplication.entity.Invite;
import com.creating.chatApplication.entity.InviteGroup;

import java.util.List;

public interface InviteService {
    Invite createInvite(String senderUsername, String recipientEmail, int type, InviteGroup inviteGroup, String roomId);
    List<Invite> getInvites(String s_email, String r_email, int type);
    List<Invite> getInvitesByRoom(String s_email, String r_email, int type, String room_id);

    List<Invite> getInvitesBySenderEmail(String s_email, int type);
    List<Invite> getInvitesBySenderEmailAccepted(String s_email, int type);
    List<Invite> getInvitesBySenderOrRecieverEmailAccepted(String email, int type);
    void rejectInvite(int inviteId);
    Invite saveInvite(Invite invite);
}
