package com.creating.chatApplication.repository;

import com.creating.chatApplication.entity.Invite;
import jakarta.persistence.criteria.CriteriaBuilder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InviteRepository extends JpaRepository<Invite, Integer> {
    List<Invite> findByRecipientEmail(String email);
    @Query("SELECT i FROM Invite i WHERE i.senderEmail = :senderEmail AND i.recipientEmail = :recipientEmail")
    List<Invite> findBySenderAndRecipientEmail(@Param("senderEmail") String senderEmail,
                                               @Param("recipientEmail") String recipientEmail);
}
