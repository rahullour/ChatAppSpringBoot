package com.creating.chatApplication.service;

import com.creating.chatApplication.entity.Conversation;
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
    private ConversationService conversationService;

    @Autowired
    private UserService userService;

    @Override
    public Invite createInvite(String senderEmail, String recipientEmail, int type, InviteGroup inviteGroup) {
        Invite invite = new Invite();
        invite.setSenderEmail(senderEmail);
        invite.setRecipientEmail(recipientEmail);
        invite.setType(type);

        // Get the recipient's FCM token (you need to implement this method)
        String recipientToken = userService.getFCMTokenByEmail(recipientEmail);

        // Send notification via FCM
        String notificationTitle = "New Chat Invitation";
        String notificationBody = senderEmail + " has invited you to chat.";
        return inviteRepository.save(invite);
    }

    @Override
    public List<Invite> getInvites(String s_email, String r_email, int type) {
        return inviteRepository.findBySenderRecipientEmailAndType(s_email, r_email, type);
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
    public void acceptInvite(int inviteId, String username) {
        Invite invite = inviteRepository.findById(inviteId).orElse(null);
        if (invite != null) {
            // Create a new conversation
            Conversation conversation = new Conversation();
            conversation.setName(invite.getSenderEmail() + ", " + username);
            conversation.setGroupChat(false);
            Conversation createdConversation = conversationService.createConversation(conversation, userService.getUserByUsername(invite.getSenderEmail()));

            // Add the recipient to the conversation
            User recipient = userService.getUserByUsername(username);
            conversationService.joinConversation(createdConversation, recipient);

            // Delete the invite
            inviteRepository.delete(invite);
        }
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
