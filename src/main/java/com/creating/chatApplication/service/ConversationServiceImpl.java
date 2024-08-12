package com.creating.chatApplication.service;

import com.creating.chatApplication.entity.Conversation;
import com.creating.chatApplication.entity.User;
import com.creating.chatApplication.entity.UserConversation;
import com.creating.chatApplication.repository.ConversationRepository;
import com.creating.chatApplication.repository.UserConversationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ConversationServiceImpl implements ConversationService {

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private UserConversationRepository userConversationRepository;

    @Override
    public Conversation createConversation(Conversation conversation, User creator) {
        // Save the conversation to the database
        Conversation savedConversation = conversationRepository.save(conversation);

        // Automatically join the creator to the conversation
        joinConversation(savedConversation, creator);

        return savedConversation;
    }

    @Override
    public void joinConversation(Conversation conversation, User user) {
        // Create a new UserConversation entity
        UserConversation userConversation = new UserConversation();
        userConversation.setConversation(conversation);
        userConversation.setUser(user);
        userConversation.setJoinedAt(LocalDateTime.now()); // Set the join time

        // Save the UserConversation association
        userConversationRepository.save(userConversation);
    }

    @Override
    public void leaveConversation(Conversation conversation, User user) {
        // Find the UserConversation association
        UserConversation userConversation = userConversationRepository.findByConversationAndUser(conversation, user);

        // Remove the user from the conversation if it exists
        if (userConversation != null) {
            userConversationRepository.delete(userConversation);
        }
    }

    @Override
    public List<Conversation> getUserConversations(User user) {
        // Retrieve all UserConversation entities for the user
        List<UserConversation> userConversations = userConversationRepository.findByUser(user);

        // Map UserConversation to Conversation
        return userConversations.stream()
                .map(UserConversation::getConversation)
                .collect(Collectors.toList());
    }

    @Override
    public Conversation getConversationById(int id) {
        // Retrieve a conversation by its ID
        return conversationRepository.findById(id).orElse(null);
    }
}
