package com.creating.chatApplication.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_conversations")
public class UserConversation {

    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "conversation_id")
    private Conversation conversation;

    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "user_id")
    private User user;

    @Id
    @Column(name="id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name="joined_at")
    private LocalDateTime joinedAt;

    public UserConversation() {}

    public UserConversation(LocalDateTime joinedAt, Conversation conversation) {
        this.joinedAt = joinedAt;
        this.conversation = conversation;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public LocalDateTime getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(LocalDateTime joinedAt) {
        this.joinedAt = joinedAt;
    }

    public Conversation getConversation() {
        return conversation;
    }

    public void setConversation(Conversation conversation) {
        this.conversation = conversation;
    }

    @Override
    public String toString() {
        return "UserConversation{" +
                "id=" + id +
                ", joinedAt=" + joinedAt +
                ", conversation=" + conversation +
                '}';
    }
}
