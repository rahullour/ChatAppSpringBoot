package com.creating.chatApplication.repository;

import com.creating.chatApplication.entity.Invite;
import jakarta.persistence.criteria.CriteriaBuilder;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InviteRepository extends JpaRepository<Invite, Integer> {
    @Query("SELECT i FROM Invite i WHERE i.senderEmail = :senderEmail AND i.recipientEmail = :recipientEmail AND i.type = :type")
    List<Invite> findBySenderRecipientEmailAndType(@Param("senderEmail") String senderEmail,
                                               @Param("recipientEmail") String recipientEmail,
                                               @Param("type") int type);

    @Query("SELECT i FROM Invite i WHERE i.senderEmail = :senderEmail AND i.type = :type")
    List<Invite> findBySenderEmailAndType(@Param("senderEmail") String senderEmail,
                                                   @Param("type") int type);

    @EntityGraph(attributePaths = {"inviteGroup"})
    @Query("SELECT i FROM Invite i WHERE i.senderEmail = :senderEmail AND i.type = :type AND i.accepted = true")
    List<Invite> findBySenderEmailAndTypeAccepted(@Param("senderEmail") String senderEmail,
                                          @Param("type") int type);
}
