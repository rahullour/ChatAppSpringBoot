package com.creating.chatApplication.service;

import com.creating.chatApplication.entity.Invite;
import com.creating.chatApplication.entity.InviteGroup;
import com.creating.chatApplication.entity.User;
import com.creating.chatApplication.repository.InviteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class InviteServiceImpl implements InviteService {
    @Autowired
    private InviteRepository inviteRepository;

    @Autowired
    private NotificationManager notificationManager;

    @Autowired
    private UserService userService;

    @Override
    public Invite createInvite(String senderEmail, String recipientEmail, int type, InviteGroup inviteGroup, String roomId) {
        Invite invite = new Invite();
        invite.setSenderEmail(senderEmail);
        invite.setRecipientEmail(recipientEmail);
        invite.setType(type);
        invite.setRoomId(roomId);
        return inviteRepository.save(invite);
    }

    @Override
    public List<Invite> getInvites(String s_email, String r_email, int type) {
        return inviteRepository.findBySenderRecipientEmailAndType(s_email, r_email, type);
    }

    @Override
    public List<Invite> getInvitesByRoom(String s_email, String r_email, int type, String room_id) {
        return inviteRepository.findBySenderRecipientEmailTypeAndRoom(s_email, r_email, type, room_id);
    }

    @Override
    public List<Invite> getInvitesBySenderEmail(String s_email, int type) {
        return inviteRepository.findBySenderEmailAndType(s_email, type);
    }

    @Override
    public List<Invite> getInvitesBySenderEmailAccepted(String s_email, int type) {
        return inviteRepository.findBySenderEmailAndTypeAccepted(s_email, type);
    }

    @Override
    public List<Invite> getInvitesBySenderOrRecieverEmailAccepted(String email, int type) {
        return inviteRepository.findBySenderOrRecieverEmailAndTypeAccepted(email, type);
    }

    @Override
    public void rejectInvite(int inviteId) {
        Invite invite = inviteRepository.findById(inviteId).orElse(null);
        if (invite != null) {
            inviteRepository.delete(invite);
        }
    }

    @Override
    public Invite saveInvite(Invite invite) {
        return inviteRepository.save(invite);
    }
}
