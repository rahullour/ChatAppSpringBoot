package com.creating.chatApplication.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "user_group")
public class UserGroup {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name = "name")
    private String name;

    @OneToMany(mappedBy = "user_group", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<InviteGroup> invite_groups;

    public UserGroup() {}

    public UserGroup(String name) {
        this.name = name;
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

    public List<InviteGroup> getInvite_groups() {
        return invite_groups;
    }

    public void setInvite_groups(List<InviteGroup> invite_groups) {
        this.invite_groups = invite_groups;
    }

    @Override
    public String toString() {
        return "UserGroup{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", invite_groups=" + invite_groups +
                '}';
    }
}
