package com.creating.chatApplication.service;

import com.creating.chatApplication.entity.Invite;
import com.creating.chatApplication.entity.InviteGroup;
import com.creating.chatApplication.entity.UserGroup;

import java.util.List;

public interface InviteGroupService {
    InviteGroup saveInviteGroup(InviteGroup inviteGroup);
    InviteGroup findInviteGroupByInviteId(int igId);
    List<InviteGroup> findInviteGroupsByInviteId(List<Integer> inviteIds);
    void rejectInviteGroup(int igId);
}
