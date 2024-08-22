package com.creating.chatApplication.service;

import com.creating.chatApplication.entity.Conversation;
import com.creating.chatApplication.entity.Invite;
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
    public Invite createInvite(String senderEmail, String recipientEmail, int type) {
        Invite invite = new Invite();
        invite.setsenderEmail(senderEmail);
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
    public List<Invite> getInvites(String s_email, String r_email) {
        return inviteRepository.findBySenderAndRecipientEmail(s_email, r_email);
    }

    @Override
    public List<Invite> getInvitesForReciever(String email) {
        return inviteRepository.findByRecipientEmail(email);
    }

    @Override
    public void acceptInvite(int inviteId, String username) {
        Invite invite = inviteRepository.findById(inviteId).orElse(null);
        if (invite != null) {
            // Create a new conversation
            Conversation conversation = new Conversation();
            conversation.setName(invite.getsenderEmail() + ", " + username);
            conversation.setGroupChat(false);
            Conversation createdConversation = conversationService.createConversation(conversation, userService.getUserByUsername(invite.getsenderEmail()));

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
}
