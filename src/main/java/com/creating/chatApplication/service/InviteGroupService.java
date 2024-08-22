package com.creating.chatApplication.service;

import com.creating.chatApplication.entity.Invite;
import com.creating.chatApplication.entity.InviteGroup;
import com.creating.chatApplication.entity.UserGroup;

public interface InviteGroupService {
    InviteGroup createInviteGroup(UserGroup user_group, Invite invite);
}
