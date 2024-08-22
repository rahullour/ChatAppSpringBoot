package com.creating.chatApplication.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name="invite_group")
public class InviteGroup {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "group_id")
    private UserGroup user_group;

    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "invite_id")
    private Invite invite;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public InviteGroup() {
    }

    public InviteGroup(UserGroup user_group, Invite invite) {
        this.user_group = user_group;
        this.invite = invite;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public UserGroup getUser_group() {
        return user_group;
    }

    public void setUser_group(UserGroup user_group) {
        this.user_group = user_group;
    }

    public Invite getInvite() {
        return invite;
    }

    public void setInvite(Invite invite) {
        this.invite = invite;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "InviteGroup{" +
                "id=" + id +
                ", user_group=" + user_group +
                ", invite=" + invite +
                ", createdAt=" + createdAt +
                '}';
    }
}
