package com.creating.chatApplication.service.user_room;

import com.creating.chatApplication.entity.User;
import com.creating.chatApplication.entity.UserRoom;
import com.creating.chatApplication.repository.UserRoomRepository;
import com.creating.chatApplication.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserRoomService {

    @Autowired
    private UserRoomRepository userRoomRepository;

    @Autowired
    private UserService userService;


    // Method to create a new UserRoom
    public UserRoom createUserRoom(User user, String roomId) {
        UserRoom userRoom = new UserRoom(user, roomId);
        return userRoomRepository.save(userRoom);
    }

    // Method to find UserRoom by user and roomId
    public UserRoom getUserRoom(int id, String roomId) {
        User user = userService.getUserById(id);
        return userRoomRepository.findByUserAndRoomId(user, roomId);
    }
}
