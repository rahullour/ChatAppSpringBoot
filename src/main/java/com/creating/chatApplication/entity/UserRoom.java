package com.creating.chatApplication.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "user_room")
public class UserRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Auto-generated ID for the UserRoom entity

    @Column(name = "room_id", nullable = false)
    private String roomId; // Assuming roomId is of type String

    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    // Constructors
    public UserRoom() {}

    public UserRoom(User user, String roomId) {
        this.user = user;
        this.roomId = roomId;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }


    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    @Override
    public String toString() {
        return "UserRoom{" +
                "id=" + id +
                ", roomId='" + roomId + '\'' +
                ", user=" + user +
                '}';
    }
}
