package com.creating.chatApplication.repository;

import com.creating.chatApplication.entity.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StatusRepository extends JpaRepository<Status, Integer> {
    List<Status> findByUserId(int userId);
}
