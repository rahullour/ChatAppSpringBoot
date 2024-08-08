package com.creating.chatApplication.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name="message")
public class Message {

    public Message() {}

    public Message(String content, LocalDateTime sentAt) {
        this.content = content;
        this.sentAt = sentAt;
    }

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

    @Column(name="content")
    private String content;

    @Column(name="sent_at")
    private LocalDateTime sentAt;


    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }

    public Conversation getConversation() {
        return conversation;
    }

    public void setConversation(Conversation conversation) {
        this.conversation = conversation;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    @Override
    public String toString() {
        return "Message{" +
                "conversation=" + conversation +
                ", user=" + user +
                ", id=" + id +
                ", content='" + content + '\'' +
                ", sentAt=" + sentAt +
                '}';
    }
}
