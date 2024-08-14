package com.creating.chatApplication.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_conversation")
public class UserConversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;

    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "conversation_id")
    private Conversation conversation;

    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "joined_at")
    private LocalDateTime joinedAt;

    public UserConversation() {}

    public UserConversation(LocalDateTime joinedAt, Conversation conversation, User user) {
        this.joinedAt = joinedAt;
        this.conversation = conversation;
        this.user = user;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user; // Correctly set the user field
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
                ", user=" + user + // Include user in the toString for clarity
                '}';
    }
}
