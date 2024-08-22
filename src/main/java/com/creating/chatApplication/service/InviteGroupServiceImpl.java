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
    public InviteGroup createInviteGroup(UserGroup user_group, Invite invite) {
        InviteGroup ig = new InviteGroup(user_group, invite);
        return inviteGroupRepository.save(ig);
    }
}
