package com.creating.chatApplication.service;

import com.creating.chatApplication.entity.UserGroup;

public interface UserGroupService {
    UserGroup createUserGroup(String name);
    UserGroup saveUserGroup(UserGroup userGroup);
    UserGroup findUserGroupByRoomId(String roomId);
    UserGroup findUserGroupByName(String groupName);
    UserGroup findUserGroupById(int groupId);
}

