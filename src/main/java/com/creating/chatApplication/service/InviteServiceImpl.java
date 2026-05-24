package com.creating.chatApplication.service;

import com.creating.chatApplication.dto.InviteResponseDTO;
import com.creating.chatApplication.entity.Invite;
import com.creating.chatApplication.entity.InviteGroup;
import com.creating.chatApplication.entity.User;
import com.creating.chatApplication.repository.InviteGroupRepository;
import com.creating.chatApplication.repository.InviteRepository;
import com.creating.chatApplication.repository.StatusRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class InviteServiceImpl implements InviteService {
    @Autowired
    private InviteRepository inviteRepository;

    @Autowired
    private NotificationManager notificationManager;

    @Autowired
    private UserService userService;

    @Autowired
    private TokenService tokenService;
    @Autowired
    private InviteGroupServiceImpl inviteGroupServiceImpl;
    @Autowired
    private UserGroupServiceImpl userGroupServiceImpl;
    @Autowired
    private InviteGroupRepository inviteGroupRepository;
    @Autowired
    private StatusRepository statusRepository;


    @Override
        public Invite createInvite(String senderEmail, String recipientEmail, int type, InviteGroup inviteGroup, String roomId) {
        Invite invite = new Invite();
        invite.setSenderEmail(senderEmail);
        invite.setRecipientEmail(recipientEmail);
        invite.setType(type);
        invite.setRoomId(roomId);

        return inviteRepository.save(invite);
    }

    @Override
    public List<Invite> getInvites(String s_email, String r_email, int type) {
        return inviteRepository.findBySenderRecipientEmailAndType(s_email, r_email, type);
    }

    @Override
    public List<Invite> getInvitesAccepted(String s_email, int type) {
        return inviteRepository.findBySenderEmailTypeAndAccepted(s_email, type);
    }

    @Override
    public List<Invite> getInvitesBySenderReceiverAndRoom(String s_email, String r_email, int type, String room_id) {
        return inviteRepository.findBySenderRecipientEmailTypeAndRoom(s_email, r_email, type, room_id);
    }

    @Override
    public List<Invite> getInvitesBySenderEmail(String s_email, int type) {
        return inviteRepository.findBySenderEmailAndGroupType(s_email, type);
    }

    @Override
    public List<Invite> getInvitesBySenderOrReceiverEmailAccepted(String email, int type) {
        return inviteRepository.findBySenderOrReceiverEmailAndGroupTypeAndAccepted(email, type);
    }

    @Override
    public List<InviteResponseDTO> getSingleInvitesWithStatus(String currentUserEmail) {
        // 1. Fetch the single invites (type = 0)
        List<Invite> invites = inviteRepository.findBySenderOrReceiverEmailAndGroupTypeAndAccepted(currentUserEmail, 0);
        List<InviteResponseDTO> responseList = new ArrayList<>();

        for (Invite invite : invites) {
            // 2. Identify the other user's email to fetch their status
            String otherUserEmail = invite.getSenderEmail().equals(currentUserEmail)
                    ? invite.getRecipientEmail()
                    : invite.getSenderEmail();

            User invite_user = userService.getUserByEmail(otherUserEmail);
            String status = statusRepository.getStatusMessageByUserId(invite_user.getId());

            responseList.add(new InviteResponseDTO(invite, status, invite_user.getUsername(), invite_user.getId()));
        }

        return responseList;
    }

    @Override
    public List<Integer> getAllInviteIdsByRoomIdAndNotAccepted(String roomId) {
        return inviteRepository.findByRoomIdNotAccepted(roomId);
    }

    @Override
    public void rejectInvite(int inviteId) {
        Invite invite = inviteRepository.findById(inviteId).orElse(null);
        if (invite != null) {
            inviteRepository.delete(invite);
        }
    }

    @Override
    public Invite saveInvite(Invite invite) {
        return inviteRepository.save(invite);
    }
}
