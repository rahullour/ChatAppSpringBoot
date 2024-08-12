package com.creating.chatApplication.repository;

import com.creating.chatApplication.entity.Invite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InviteRepository extends JpaRepository<Invite, Integer> {
    List<Invite> findByRecipientEmail(String email);
}
