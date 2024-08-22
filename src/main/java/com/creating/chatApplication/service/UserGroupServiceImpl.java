package com.creating.chatApplication.service;

import com.creating.chatApplication.entity.InviteGroup;
import com.creating.chatApplication.entity.UserGroup;
import com.creating.chatApplication.repository.UserGroupRepository;
import com.creating.chatApplication.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserGroupServiceImpl implements UserGroupService{

    @Autowired
    private UserGroupRepository userGroupRepository;

    @Override
    public UserGroup createUserGroup(String name) {
        UserGroup userGroup = new UserGroup(name);
        return userGroupRepository.save(userGroup);
    }

    @Override
    public UserGroup saveUserGroup(UserGroup userGroup) {
        return userGroupRepository.save(userGroup);
    }

    @Override
    public UserGroup findUserGroupByName(String groupName) {
        return userGroupRepository.findByName(groupName);
    }
}
