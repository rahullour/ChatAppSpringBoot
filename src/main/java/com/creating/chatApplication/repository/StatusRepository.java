package com.creating.chatApplication.repository;

import com.creating.chatApplication.entity.Invite;
import com.creating.chatApplication.entity.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StatusRepository extends JpaRepository<Status, Integer> {
    Status findByUserId(int userId);
    Status getStatusByUserId(@Param("userId") int userId);
}
