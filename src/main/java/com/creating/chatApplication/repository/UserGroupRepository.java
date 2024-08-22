package com.creating.chatApplication.repository;

import com.creating.chatApplication.entity.UserData;
import com.creating.chatApplication.entity.UserGroup;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserGroupRepository extends JpaRepository<UserGroup, Integer> {
    UserGroup findByName(String name);
}
