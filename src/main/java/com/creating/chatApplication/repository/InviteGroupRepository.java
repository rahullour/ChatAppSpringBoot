package com.creating.chatApplication.repository;

import com.creating.chatApplication.entity.Invite;
import com.creating.chatApplication.entity.InviteGroup;
import jakarta.persistence.criteria.CriteriaBuilder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InviteGroupRepository extends JpaRepository<InviteGroup, Integer> {
    InviteGroup findByInviteId(int igId);
    @Query("SELECT ig FROM InviteGroup ig WHERE ig.invite.id IN :inviteIds")
    List<InviteGroup> findAllByInviteId(@Param("inviteIds") List<Integer> inviteIds);
}
