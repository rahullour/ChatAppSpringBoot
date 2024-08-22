package com.creating.chatApplication.service;

import com.creating.chatApplication.entity.UserGroup;
import com.creating.chatApplication.repository.UserGroupRepository;
import com.creating.chatApplication.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserGroupServiceImpl implements UserGroupService{

    @Autowired
    private UserGroupRepository userGroupRepository;

    @Override
    public UserGroup createUserGroup(String name) {
        UserGroup user_group = new UserGroup(name);
        return userGroupRepository.save(user_group);
    }
}
