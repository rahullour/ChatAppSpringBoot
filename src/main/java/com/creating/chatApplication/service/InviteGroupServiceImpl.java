package com.creating.chatApplication.service;

import com.creating.chatApplication.entity.Invite;
import com.creating.chatApplication.entity.InviteGroup;
import com.creating.chatApplication.entity.UserGroup;
import com.creating.chatApplication.repository.InviteGroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class InviteGroupServiceImpl implements InviteGroupService{
    @Autowired
    private InviteGroupRepository inviteGroupRepository;

    @Override
    public InviteGroup saveInviteGroup(InviteGroup inviteGroup) {
        return inviteGroupRepository.save(inviteGroup);
    }

    @Override
    public InviteGroup findInviteGroupByInviteId(int igId) {
        return inviteGroupRepository.findByInviteId(igId);
    }

    @Override
    public List<InviteGroup> findInviteGroupsByInviteId(List<Integer> inviteIds) {
        return inviteGroupRepository.findAllByInviteId(inviteIds);
    }

    @Override
    public void rejectInviteGroup(int inviteId) {
        InviteGroup inviteGroup = inviteGroupRepository.findByInviteId(inviteId);
        if (inviteGroup != null) {
            inviteGroup.setUserGroup(null);
            inviteGroupRepository.save(inviteGroup);
            inviteGroupRepository.delete(inviteGroup);
        }
    }
}
