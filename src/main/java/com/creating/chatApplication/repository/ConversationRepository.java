package com.creating.chatApplication.repository;
import com.creating.chatApplication.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConversationRepository extends JpaRepository<Conversation, Integer> {
    Conversation findByName(String name);
}
