package com.creating.chatApplication.repository;

import com.creating.chatApplication.entity.Invite;
import com.creating.chatApplication.entity.UserData;
import com.creating.chatApplication.entity.UserGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.ArrayList;
import java.util.List;

public interface UserGroupRepository extends JpaRepository<UserGroup, Integer> {
    UserGroup findByName(String name);
    UserGroup findByRoomId(String roomId);
    @Query("SELECT i FROM UserGroup i WHERE i.name = :groupName_param")
    List<UserGroup> findAllUserGroupsByName(@Param("groupName_param") String groupName);
}
