package com.creating.chatApplication.service;

import com.creating.chatApplication.entity.Invite;
import com.creating.chatApplication.entity.InviteGroup;
import com.creating.chatApplication.entity.UserGroup;
import com.creating.chatApplication.repository.InviteGroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class InviteGroupServiceImpl implements InviteGroupService{
    @Autowired
    private InviteGroupRepository inviteGroupRepository;

    @Override
    public InviteGroup saveInviteGroup(InviteGroup inviteGroup) {
        return inviteGroupRepository.save(inviteGroup);
    }
}
