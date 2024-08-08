package com.creating.chatApplication.entity;

import jakarta.persistence.*;
import java.util.*;

@Entity
@Table(name="conversation")
public class Conversation {

    @OneToMany(mappedBy = "conversation")
    private List<UserConversation> userConversations;

    @OneToMany(mappedBy = "conversation")
    private List<Message> messages;

    @Id
    @Column(name="id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    public Conversation() {}

    public Conversation(String name, String createdAt, boolean isGroupChat) {
        this.name = name;
        this.createdAt = createdAt;
        this.isGroupChat = isGroupChat;
    }

    @Column(name="name")
    private String name;

    @Column(name="created_at")
    private String createdAt;

    @Column(name="is_group_chat")
    private boolean isGroupChat;

    public List<UserConversation> getUserConversations() {
        return userConversations;
    }

    public void setUserConversations(List<UserConversation> userConversations) {
        this.userConversations = userConversations;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isGroupChat() {
        return isGroupChat;
    }

    public void setGroupChat(boolean groupChat) {
        isGroupChat = groupChat;
    }

    public List<Message> getMessages() {
        return messages;
    }

    public void setMessages(List<Message> messages) {
        this.messages = messages;
    }

    @Override
    public String toString() {
        return "Conversation{" +
                "userConversations=" + userConversations +
                ", messages=" + messages +
                ", id=" + id +
                ", name='" + name + '\'' +
                ", createdAt='" + createdAt + '\'' +
                ", isGroupChat=" + isGroupChat +
                '}';
    }
}
