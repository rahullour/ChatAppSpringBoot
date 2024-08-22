package com.creating.chatApplication.repository;

import com.creating.chatApplication.entity.InviteGroup;
import jakarta.persistence.criteria.CriteriaBuilder;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InviteGroupRepository extends JpaRepository<InviteGroup, Integer> {
}
