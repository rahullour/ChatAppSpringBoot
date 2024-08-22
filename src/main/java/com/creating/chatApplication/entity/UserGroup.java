package com.creating.chatApplication.entity;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "user_group")
public class UserGroup {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name = "name")
    private String name;

    @OneToMany(mappedBy = "userGroup", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<InviteGroup> inviteGroups;

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

    public List<InviteGroup> getInviteGroups() {
        return inviteGroups;
    }

    public void setInviteGroups(List<InviteGroup> inviteGroups) {
        this.inviteGroups = inviteGroups;
    }

    @Override
    public String toString() {
        return "UserGroup{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", inviteGroups=" + inviteGroups +
                '}';
    }
}
