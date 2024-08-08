package com.creating.chatApplication.repository;

import com.creating.chatApplication.entity.UserData;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserDataRepository extends JpaRepository<UserData, Integer> {
    UserData findByUserId(int user_id);
}
