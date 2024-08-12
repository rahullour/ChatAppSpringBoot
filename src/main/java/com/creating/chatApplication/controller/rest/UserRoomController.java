package com.creating.chatApplication.controller.rest;

import com.creating.chatApplication.entity.UserRoom;
import com.creating.chatApplication.service.UserService;
import com.creating.chatApplication.service.user_room.UserRoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/userRoom")
public class UserRoomController {

    @Autowired
    private UserRoomService userRoomService;

    @Autowired
    private UserService userService;

    // Endpoint to create a new UserRoom
    @PostMapping
    public UserRoom createUserRoom(@RequestBody UserRoom userRoom) {
        return userRoomService.createUserRoom(userService.getCurrentUser(), userRoom.getRoomId());
    }

    // Endpoint to get UserRoom by userId and roomId
    @GetMapping("/{userId}/{roomId}")
    public UserRoom getUserRoom(@PathVariable int userId, @PathVariable String roomId) {
        return userRoomService.getUserRoom(userId, roomId);
    }
}
