package com.creating.chatApplication.repository;

import com.creating.chatApplication.entity.Conversation;
import com.creating.chatApplication.entity.User;
import com.creating.chatApplication.entity.UserConversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserConversationRepository extends JpaRepository<UserConversation, Integer> {
    List<UserConversation> findByUser(User user);
    UserConversation findByConversationAndUser(Conversation conversation, User user);
}
