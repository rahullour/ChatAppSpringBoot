package com.creating.chatApplication.entity;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "token")
public class Token {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;


    @Column(name = "type")
    private String type;

    @Column(name = "token")
    private String token;

    @Column(name = "expire_at")
    private LocalDateTime expire_at;

    @Column(name = "room_id")
    private String roomId;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    // Default constructor
    public Token() {}

    public Token(LocalDateTime expireAt, String roomId, String token, String type) {
        this.expire_at = expireAt;
        this.roomId = roomId;
        this.token = token;
        this.type = type;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public LocalDateTime getExpire_at() {
        return expire_at;
    }

    public void setExpire_at(LocalDateTime expire_at) {
        this.expire_at = expire_at;
    }

    @Override
    public String toString() {
        return "Token{" +
                "id=" + id +
                ", type='" + type + '\'' +
                ", token='" + token + '\'' +
                ", expire_at='" + expire_at + '\'' +
                '}';
    }
}
