package com.creating.chatApplication.service;

import com.creating.chatApplication.entity.UserGroup;

import java.util.List;

public interface UserGroupService {
    UserGroup createUserGroup(String name);
    UserGroup saveUserGroup(UserGroup userGroup);
    List<UserGroup> getAllUserGroupsByName(String groupName);
        UserGroup findUserGroupByRoomId(String roomId);
    UserGroup findUserGroupById(int groupId);
}

