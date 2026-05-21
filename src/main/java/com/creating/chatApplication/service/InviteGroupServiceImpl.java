package com.creating.chatApplication.service;

import com.creating.chatApplication.entity.Invite;
import com.creating.chatApplication.entity.InviteGroup;
import com.creating.chatApplication.entity.UserGroup;
import com.creating.chatApplication.repository.InviteGroupRepository;
import com.creating.chatApplication.repository.UserGroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class InviteGroupServiceImpl implements InviteGroupService{
    @Autowired
    private InviteGroupRepository inviteGroupRepository;
    @Autowired
    private UserGroupServiceImpl userGroupServiceImpl;
    @Autowired
    private UserGroupRepository userGroupRepository;

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
    public List<InviteGroup> getAllInviteGroupByGroupId(int groupId) {
        return inviteGroupRepository.findAllByGroupId(groupId);
    }


    @Override
    public void rejectInviteGroupByInviteId(int inviteId) {
        InviteGroup inviteGroup = inviteGroupRepository.findByInviteId(inviteId);
        if (inviteGroup != null) {
            UserGroup userGroup = inviteGroup.getUserGroup();
            inviteGroup.setUserGroup(null);
            inviteGroupRepository.save(inviteGroup);
            inviteGroupRepository.delete(inviteGroup);
            if (userGroup != null) {
                userGroupRepository.delete(userGroup);
            }
        }
    }
}
