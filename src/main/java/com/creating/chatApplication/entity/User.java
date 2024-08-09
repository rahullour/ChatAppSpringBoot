package com.creating.chatApplication.entity;


import jakarta.persistence.*;
import jdk.jfr.Enabled;

import java.util.List;

@Entity
@Table(name="user")
public class User {

    @OneToMany(mappedBy = "user")
    private List<UserConversation> userConversations;

    @OneToMany(mappedBy = "user")
    private List<Message> messages;

    public User() {}

    public User(String username, String password, String enabled, String email) {
        this.username = username;
        this.password = password;
        this.enabled = enabled;
        this.email = email;
    }

    @Id
    @Column(name="id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name="username")
    private String username;

    @Column(name="password")
    private String password;

    @Column(name="enabled")
    private String enabled;

    @Column(name="email")
    private String email;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getEnabled() {
        return enabled;
    }

    public void setEnabled(String enabled) {
        this.enabled = enabled;
    }

    public List<UserConversation> getUserConversations() {
        return userConversations;
    }

    public void setUserConversations(List<UserConversation> userConversations) {
        this.userConversations = userConversations;
    }

    public List<Message> getMessages() {
        return messages;
    }

    public void setMessages(List<Message> messages) {
        this.messages = messages;
    }

    @Override
    public String toString() {
        return "User{" +
                "userConversations=" + userConversations +
                ", messages=" + messages +
                ", id=" + id +
                ", username='" + username + '\'' +
                ", password='" + password + '\'' +
                ", enabled='" + enabled + '\'' +
                ", email='" + email + '\'' +
                '}';
    }
}
