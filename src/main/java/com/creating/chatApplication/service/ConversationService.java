package com.creating.chatApplication.service;

import com.creating.chatApplication.entity.Conversation;
import com.creating.chatApplication.entity.User;
import com.creating.chatApplication.entity.UserConversation;

import java.util.List;

public interface ConversationService {
    Conversation createConversation(Conversation conversation, User creator);
    void joinConversation(Conversation conversation, User user);
    void leaveConversation(Conversation conversation, User user);
    List<Conversation> getUserConversations(User user);
    Conversation getConversationById(int id);
}
